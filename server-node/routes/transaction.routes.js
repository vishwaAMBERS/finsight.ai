const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware')

const {
    addTransaction,
    getTransactions,
    deleteTransaction,
    getSummary
} = require('../controller/transaction.controller')

router.post('/', authMiddleware, addTransaction)
router.get('/', authMiddleware, getTransactions)
router.delete('/:id', authMiddleware, deleteTransaction)
router.get('/summary', authMiddleware, getSummary)

module.exports = router