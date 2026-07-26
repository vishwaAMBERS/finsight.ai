const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/auth.middleware')
const {
  addTransaction,
  getTransactions,
  getTransactionById,
  deleteTransaction,
  getSummary
} = require('../controller/transaction.controller')      

router.post('/', verifyToken, addTransaction)
router.get('/', verifyToken, getTransactions)
router.get('/summary', verifyToken, getSummary)
router.get('/:id', verifyToken, getTransactionById)
router.delete('/:id', verifyToken, deleteTransaction)

module.exports = router