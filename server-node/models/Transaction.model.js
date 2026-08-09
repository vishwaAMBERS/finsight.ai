const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: { type: String, default: 'other' },
  description: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['expense', 'income'], default: 'expense' }
}, { timestamps: true })

module.exports = mongoose.model('Transaction', TransactionSchema)
