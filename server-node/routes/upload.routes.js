const express = require('express')
const router = express.Router()
const multer = require('multer')
const authMiddleware = require('../middleware/auth.middleware')
const { uploadStatement } = require('../controller/upload.controller')

// Store file in memory as buffer — no disk writes
const storage = multer.memoryStorage()

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'))
    }
  }
})

router.post(
  '/statement', 
  authMiddleware, 
  upload.single('file'), 
  uploadStatement
)

module.exports = router