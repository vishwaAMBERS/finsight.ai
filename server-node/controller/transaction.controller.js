const Transaction = require('../models/Transaction.model')
const { categorizeTransaction } = require('../services/gemini.service')
const { analyzeTransaction } = require('../services/mlBridge.service')

const addTransaction = async (req, res) => {
  try {
    const { amount, description, date, type, category } = req.body
    const userId = req.user?.sub || req.user?.userId || req.user?.id

    if (!amount || !description) {
      return res.status(400).json({
        error: 'amount and description are required'
      })
    }

    // Step 1 — AI categorization
    let finalCategory = category
    if (!category || category === 'auto') {
      console.log(`🤖 Gemini categorizing: "${description}"`)
      finalCategory = await categorizeTransaction(description)
      console.log(`✅ Category: ${finalCategory}`)
    }

    // Step 2 — Save transaction to MongoDB
    const transaction = new Transaction({
      userId,
      amount,
      category: finalCategory,
      description,
      date: date || Date.now(),
      type: type || 'expense'
    })

    const saved = await transaction.save()

    // Step 3 — Get user's transaction history for ML
    const history = await Transaction
      .find({ userId, type: 'expense' })
      .sort({ date: -1 })
      .limit(100)
      .lean()

    // Step 4 — Run anomaly detection
    console.log(`🔍 Running anomaly detection...`)
    const mlResult = await analyzeTransaction(saved, history)
    console.log(`ML result: score=${mlResult.anomalyScore}, isAnomaly=${mlResult.isAnomaly}`)

    // Step 5 — Update transaction with ML results
    if (mlResult.isAnomaly) {
      await Transaction.findByIdAndUpdate(saved._id, {
        isAnomaly: true,
        anomalyScore: mlResult.anomalyScore
      })

      // Step 6 — Emit real-time alert via Socket.io
      const io = req.app.get('io')
      if (io) {
        io.to(userId).emit('alert:anomaly', {
          transactionId: saved._id,
          description: saved.description,
          amount: saved.amount,
          anomalyScore: mlResult.anomalyScore,
          reason: mlResult.reason,
          timestamp: new Date()
        })
        console.log(`🚨 Alert emitted to user ${userId}`)
      }
    }

    return res.status(201).json({
      ...saved.toObject(),
      aiCategorized: !category || category === 'auto',
      anomalyScore: mlResult.anomalyScore,
      isAnomaly: mlResult.isAnomaly,
      anomalyReason: mlResult.reason
    })

  } catch (err) {
    console.log('Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

const getTransactions = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.userId || req.user?.id
    const { category, type, limit = 20, page = 1 } = req.query

    const filter = { userId }
    if (category) filter.category = category
    if (type) filter.type = type

    const skip = (page - 1) * limit

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip(Number(skip))
      .limit(Number(limit))

    const total = await Transaction.countDocuments(filter)

    return res.json({
      transactions,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

const getTransactionById = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.userId || req.user?.id
    const { id } = req.params

    const transaction = await Transaction.findById(id)

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    return res.json(transaction)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.userId || req.user?.id
    const { id } = req.params

    const transaction = await Transaction.findById(id)

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await Transaction.findByIdAndDelete(id)
    return res.json({ message: 'Transaction deleted successfully' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

const getSummary = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.userId || req.user?.id

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ])

    const totalSpent = categoryBreakdown.reduce(
      (sum, cat) => sum + cat.total, 0
    )

    const incomeResult = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'income',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: { _id: null, total: { $sum: '$amount' } }
      }
    ])

    const totalIncome = incomeResult.length > 0
      ? incomeResult[0].total
      : 0

    const savings = totalIncome - totalSpent

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]

    return res.json({
      month: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      totalSpent,
      totalIncome,
      savings,
      categoryBreakdown
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = {
  addTransaction,
  getTransactions,
  getTransactionById,
  deleteTransaction,
  getSummary
}