const Transaction = require('../models/Transaction.model')
const { categorizeTransaction } = require('../services/gemini.service')
const { parseCSVBuffer } = require('../services/csvParser.service')

const uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const userId = req.user?.sub || req.user?.userId || req.user?.id

    console.log(`📄 Processing CSV file: ${req.file.originalname}`)
    console.log(`📊 File size: ${req.file.size} bytes`)

    // Parse CSV from buffer
    const rows = await parseCSVBuffer(req.file.buffer)
    console.log(`✅ Found ${rows.length} rows in CSV`)

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty' })
    }

    if (rows.length > 500) {
      return res.status(400).json({ 
        error: 'CSV too large. Maximum 500 transactions per upload.' 
      })
    }

    // Show available columns to help user format CSV
    console.log('CSV columns found:', Object.keys(rows[0]))

    const transactions = []
    const errors = []

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      try {
        // Support multiple CSV formats
        const description = (
          row['Description'] || row['description'] || 
          row['Narration'] || row['narration'] ||
          row['Details'] || row['details'] ||
          row['Particulars'] || row['particulars'] || ''
        ).toString().trim()

        const debitRaw = row['Debit'] || row['debit'] || ''
        const creditRaw = row['Credit'] || row['credit'] || ''
        const amountRaw = row['Amount'] || row['amount'] || row['Transaction Amount'] || ''
        const dateRaw = row['Date'] || row['date'] || row['Transaction Date'] || row['Value Date'] || ''
        const typeRaw = row['Type'] || row['type'] || row['Transaction Type'] || ''

        let parsedAmount = 0
        let type = 'expense'

        const parseVal = (val) => {
          if (!val) return 0
          const cleaned = val.toString().replace(/[₹,\s]/g, '')
          const num = parseFloat(cleaned)
          return isNaN(num) ? 0 : num
        }

        const debitVal = parseVal(debitRaw)
        const creditVal = parseVal(creditRaw)
        const genericAmountVal = parseVal(amountRaw)

        if (debitVal > 0) {
          parsedAmount = debitVal
          type = 'expense'
        } else if (creditVal > 0) {
          parsedAmount = creditVal
          type = 'income'
        } else if (genericAmountVal > 0) {
          parsedAmount = genericAmountVal
          if (typeRaw) {
            const typeLower = typeRaw.toLowerCase()
            if (typeLower.includes('credit') || typeLower.includes('income') || typeLower.includes('salary')) {
              type = 'income'
            }
          }
        }

        // Skip rows with no description or valid amount
        if (!description || parsedAmount <= 0) {
          errors.push(`Row ${i + 2}: Invalid description or amount`)
          continue
        }

        const amount = parsedAmount

        // Parse date
        let date = new Date()
        if (dateRaw) {
          const parsed = new Date(dateRaw)
          if (!isNaN(parsed.getTime())) {
            date = parsed
          }
        }

        // Ask Gemini to categorize
        console.log(`🤖 Categorizing row ${i + 1}: "${description}"`)
        const category = await categorizeTransaction(description)

        transactions.push({
          userId,
          amount,
          description: description.trim(),
          category,
          type,
          date,
          isAnomaly: false,
          anomalyScore: 0
        })

      } catch (rowErr) {
        errors.push(`Row ${i + 2}: ${rowErr.message}`)
      }
    }

    if (transactions.length === 0) {
      return res.status(400).json({ 
        error: 'No valid transactions found in CSV',
        details: errors
      })
    }

    // Save all transactions to MongoDB at once
    const saved = await Transaction.insertMany(transactions)
    console.log(`✅ Saved ${saved.length} transactions to MongoDB`)

    return res.status(201).json({
      message: `Successfully imported ${saved.length} transactions`,
      imported: saved.length,
      skipped: errors.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (err) {
    console.log('Upload error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { uploadStatement }