const express = require('express')
const router = express.Router()
const authMiddleware = require('../middleware/auth.middleware')
const { getAdvice } = require('../controller/chat.controller')

router.post('/advice', authMiddleware, getAdvice)

module.exports = router