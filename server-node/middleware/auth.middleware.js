const jwt = require('jsonwebtoken')

const authmiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({
            error: 'Access denied . No token provided'
        })
    }
    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            console.log('JWT token expired')
            return res.status(401).json({
                error: 'Token expired. Please log in again.',
                code: 'TOKEN_EXPIRED'
            })
        }
        console.log('JWT verification failed:', err.message)
        return res.status(401).json({
            error: 'Invalid or expired token.',
            code: 'INVALID_TOKEN'
        })
    }
}

module.exports = authmiddleware