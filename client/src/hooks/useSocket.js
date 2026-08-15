import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export const useSocket = (onAlert) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const onAlertRef = useRef(onAlert)

  useEffect(() => {
    onAlertRef.current = onAlert
  }, [onAlert])

  useEffect(() => {
    if (!user?.userId) return

    // Connect to Node.js Socket.io server
    const nodeUrl = import.meta.env.VITE_NODE_URL || 'http://localhost:5000'
    socketRef.current = io(nodeUrl)

    // Join personal room
    socketRef.current.on('connect', () => {
      console.log('Socket connected')
      socketRef.current.emit('join', user.userId)
    })

    // Listen for fraud alerts
    socketRef.current.on('alert:anomaly', (data) => {
      console.log('🚨 Anomaly alert received:', data)
      if (onAlertRef.current) onAlertRef.current(data)
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [user?.userId])

  return socketRef.current
}