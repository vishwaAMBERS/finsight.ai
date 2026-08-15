const axios = require('axios')

const ML_SERVICE_URL = 'http://localhost:8000'

const analyzeTransaction = async (newTransaction, historyTransactions) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/analyze`,
      {
        newTransaction: {
          amount: newTransaction.amount,
          description: newTransaction.description,
          date: newTransaction.date
        },
        history: historyTransactions.map(tx => ({
          amount: tx.amount,
          description: tx.description,
          date: tx.date
        }))
      },
      { timeout: 10000 }  // 10 second timeout
    )

    return response.data

  } catch (err) {
    // If ML service is down, fail gracefully
    console.log('ML service unavailable:', err.message)
    return {
      anomalyScore: 0,
      isAnomaly: false,
      reason: 'ML service unavailable'
    }
  }
}

module.exports = { analyzeTransaction }