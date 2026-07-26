const Transaction = require('../models/Transaction.model')

// Add a new transaction
const addTransaction = async (req, res) => {
  try {
    const { amount, category, description, date, type } = req.body
    const userId = req.user.sub

    if (!amount || !description) {
      return res.status(400).json({ 
        error: 'amount and description are required' 
      })
    }

    const transaction = new Transaction({
      userId,
      amount,
      category: category || 'other',
      description,
      date: date || Date.now(),
      type: type || 'expense'
    })

    const saved = await transaction.save()
    return res.status(201).json(saved)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// Get all transactions for logged in user
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.sub
    const { category, type, limit = 20, page = 1 } = req.query

    // Build filter
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

// Get single transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.sub
    const { id } = req.params

    const transaction = await Transaction.findById(id)

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Make sure user can only see their own transactions
    if (transaction.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    return res.json(transaction)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const userId = req.user.sub
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

// Get monthly summary by category
const getSummary = async (req, res) => {
  try {
    const userId = req.user.sub

    // Get start and end of current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Category breakdown for expenses
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

    // Total spent this month
    const totalSpent = categoryBreakdown.reduce(
      (sum, cat) => sum + cat.total, 0
    )

    // Total income this month
    const incomeResult = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'income',
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ])

    const totalIncome = incomeResult.length > 0 
      ? incomeResult[0].total 
      : 0

    // Daily spending for chart (last 30 days)
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