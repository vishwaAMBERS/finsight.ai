const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
require('dotenv').config()

const app = express()

// Create HTTP server for Socket.io
const server = http.createServer(app)

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Store io instance so controllers can use it
app.set('io', io)

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`)

  // User joins their personal room using their userId
  socket.on('join', (userId) => {
    socket.join(userId)
    console.log(`👤 User ${userId} joined their room`)
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`)
  })
})

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'FinSight AI - Node.js server running',
    status: 'ok'
  })
})

// Routes
const transactionRoutes = require('./routes/transaction.routes')
const chatRoutes = require('./routes/chat.routes')
const uploadRoutes = require('./routes/upload.routes')

app.use('/api/transactions', transactionRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/upload', uploadRoutes)

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.log('❌ MongoDB error:', err.message))

// Start server — use server.listen not app.listen for Socket.io
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})