const Transaction = require('../models/Transaction.model')

const addTransaction = async (req, res) => {
  try {
    console.log('req.user:', req.user)        // see what JWT decoded
    console.log('req.body:', req.body)        // see what body contains

    const { amount, category, description, date, type } = req.body
    const userId = req.user.sub

    if (!userId) {
      return res.status(400).json({ error: 'userId missing from token' })
    }

    const transaction = new Transaction({
      userId,
      amount,
      category,
      description,
      date: date || Date.now(),
      type: type || 'expense'
    })

    const saved = await transaction.save()
    res.status(201).json(saved)

  } catch (err) {
    console.log('Error:', err.message)        // see exact error
    res.status(500).json({ error: err.message })
  }
}

const getTransactions = async(req, res) => {
    try {
        const userId = req.user.sub
        const transactions = await Transaction
        .find({userId})
        .sort({date:-1})

        res.json(transactions)
    }catch(err){
        res.status(500).json({error : err.message})
    }
}

const deleteTransaction = async(req , res) => {
    try {
        const userId = req.user.sub
        const { id } = req.params

        const transaction = await Transaction.findById(id)

        if(!transaction){
            return res.status(404).json({error : 'Transaction not found'})
        }

        if(transaction.userId !== userId){
            return res.status(403).json({error:'Not authorized'})
        }
        await Transaction.findByIdAndDelete(id)
        res.json ({ message :' Transaction deleted successfully '})
    }catch(err){
        res.status(500).json({ error: err.message})
    }
}

const getSummary = async(req, res) => {
    try{
        const userId = req.user.sub 
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const summary = await Transaction.aggregate([
            {
                $match:{
                    userId ,
                     date : {$gte : startOfMonth},
                     type: 'expense'
                }
            },
            {
                $group:{
                    _id: '$category',
                    total : { $sum : '$amount'},
                    count: {$sum : 1}
                }
            },
            {$sort : {total : -1}}
        ])

        const totalSpent = summary.reduce((sum, cat) => sum + cat.total, 0)

        res.json({
            totalSpent,
            breakdown: summary,
            month : new Date().toLocaleString('default', {month :'long'})
        })
    }catch(err){
        res.status(500).json({error : err.message})
    }
}
module.exports = {
    addTransaction, getTransactions,
    deleteTransaction, getSummary
}