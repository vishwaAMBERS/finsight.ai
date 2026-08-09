const Transaction = require('../models/Transaction.model')
const { categorizeTransaction } = require('../services/gemini.service')

const addTransaction = async (req, res) => {
  try {
    const { amount, description, date, type, category } = req.body
    const userId = req.user?.sub || req.user?.userId || req.user?.id

    if (!amount || !description) {
      return res.status(400).json({
        error: 'amount and description are required'
      })
    }

    // If user provided a category use it
    // Otherwise ask Gemini to categorize automatically
    let finalCategory = category

    if (!category || category === 'auto') {
      console.log(`🤖 Asking Gemini to categorize: "${description}"`)
      finalCategory = await categorizeTransaction(description)
      console.log(`✅ Gemini categorized as: ${finalCategory}`)
    }

    const transaction = new Transaction({
      userId,
      amount,
      category: finalCategory,
      description,
      date: date || Date.now(),
      type: type || 'expense'
    })

    const saved = await transaction.save()

    // Return saved transaction with aiCategorized flag
    return res.status(201).json({
      ...saved.toObject(),
      aiCategorized: !category || category === 'auto'
    })

  } catch (err) {
    console.log('Error adding transaction:', err.message)
    return res.status(500).json({ error: err.message })
  }
}

// Keep all other functions exactly the same
const getTransactions = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.userId || req.user?.id
    const { category, type, limit = 20, page = 1 } = req.query

    const filter = { userId }
    if (category) filter.category = category
    if (type) filter.type = type

    const skip = (page - 1) * limit

    const transactions = await Transaction
      .find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip)

    const total = await Transaction.countDocuments(filter)

    return res.json({
      transactions,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
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

    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ])

    return res.json({
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      totalSpent,
      totalIncome,
      savings: totalIncome - totalSpent,
      categoryBreakdown,
      dailySpending
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