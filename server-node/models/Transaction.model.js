const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  category: { type: String, default: 'other' },
  description: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['expense', 'expenses', 'income'], default: 'expense' }
}, { timestamps: true })

module.exports = mongoose.model('Transaction', TransactionSchema)
