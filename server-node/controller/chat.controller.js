const { getFinancialAdvice } = require('../services/gemini.service')
const Transaction = require('../models/Transaction.model')

const getAdvice = async (req, res) => {
  try {
    const userId = req.user?.sub || req.user?.userId || req.user?.id
    const { message } = req.body

    if (!message) {
      return res.status(400).json({ error: 'message is required' })
    }

    // Get user's financial context from MongoDB
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      }
    ])

    const totalSpent = categoryBreakdown.reduce(
      (sum, cat) => sum + cat.total, 0
    )

    const incomeResult = await Transaction.aggregate([
      {
        $match: { userId, type: 'income', date: { $gte: startOfMonth } }
      },
      {
        $group: { _id: null, total: { $sum: '$amount' } }
      }
    ])

    const totalIncome = incomeResult[0]?.total || 0

    const userContext = {
      salary: totalIncome,
      totalSpent,
      savings: totalIncome - totalSpent,
      categoryBreakdown
    }

    const advice = await getFinancialAdvice(userContext, message)

    return res.json({ advice, message })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

module.exports = { getAdvice }