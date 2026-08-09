import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { register } from '../services/springApi'

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', salary: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await register({
        ...form,
        salary: parseFloat(form.salary) || 0
      })
      const { token, userId, name, email, role } = res.data
      loginUser(token, { userId, name, email, role })
      navigate('/dashboard')
    } catch (err) {
      const serverErr = err.response?.data
      let msg = 'Registration failed'
      if (typeof serverErr === 'string') {
        msg = serverErr
      } else if (serverErr?.error) {
        msg = serverErr.error
      } else if (serverErr?.message) {
        msg = serverErr.message
      } else if (serverErr && typeof serverErr === 'object') {
        msg = Object.values(serverErr).join(', ')
      } else if (err.message) {
        msg = err.message
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">FinSight AI</h1>
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Register</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-400 
                          px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1 block">Full name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg 
                         px-4 py-3 text-white placeholder-gray-500 
                         focus:outline-none focus:border-blue-500"
                placeholder="Vishwa Mulge"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg 
                         px-4 py-3 text-white placeholder-gray-500 
                         focus:outline-none focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg 
                         px-4 py-3 text-white placeholder-gray-500 
                         focus:outline-none focus:border-blue-500"
                placeholder="minimum 6 characters"
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1 block">
                Monthly salary (₹)
              </label>
              <input
                type="number"
                name="salary"
                value={form.salary}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg 
                         px-4 py-3 text-white placeholder-gray-500 
                         focus:outline-none focus:border-blue-500"
                placeholder="25000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 
                       text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-gray-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}