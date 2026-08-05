import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMe } from '../services/springApi'
import AiAdvisor from '../components/AiAdvisor'
import {
  getSummary, getTransactions,
  addTransaction, deleteTransaction
} from '../services/nodeApi'
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer
} from 'recharts'

export default function Dashboard() {
  const { user, logoutUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [summary, setSummary] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    amount: '', description: '', category: 'food', type: 'expense'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, summaryRes, txRes] = await Promise.all([
        getMe(),
        getSummary(),
        getTransactions({ limit: 10 })
      ])
      setProfile(profileRes.data)
      setSummary(summaryRes.data)
      setTransactions(txRes.data.transactions)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleAddTransaction = async (e) => {
    e.preventDefault()

    const amount = parseFloat(form.amount)
    setSaving(true)
    try {
      await addTransaction({ ...form, amount })
      setForm({ amount: '', description: '', category: 'food', type: 'expense' })
      setShowForm(false)
      loadData() // Refetches transaction history & analytics from MongoDB
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction?')) return
    try {
      await deleteTransaction(id)
      loadData()
    } catch (err) {
      console.error('Error deleting transaction:', err)
    }
  }

  const categoryColors = {
    food: 'bg-orange-500',
    rent: 'bg-red-500',
    entertainment: 'bg-purple-500',
    emi: 'bg-yellow-500',
    salary: 'bg-green-500',
    shopping: 'bg-pink-500',
    health: 'bg-blue-500',
    transport: 'bg-cyan-500',
    other: 'bg-gray-500'
  }

  // Format chart data
  const chartData = summary?.categoryBreakdown?.map(cat => ({
    name: cat._id,
    amount: cat.total
  })) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-400">FinSight AI</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              Hello, {profile?.name || user?.name}
            </span>
            <button
              onClick={logoutUser}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Total Spent</p>
            <p className="text-3xl font-bold text-red-400 mt-1">
              ₹{summary?.totalSpent?.toLocaleString() || 0}
            </p>
            <p className="text-gray-500 text-xs mt-1">{summary?.month}</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Total Income</p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              ₹{summary?.totalIncome?.toLocaleString() || 0}
            </p>
            <p className="text-gray-500 text-xs mt-1">{summary?.month}</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Savings</p>
            <p className={`text-3xl font-bold mt-1 ${(summary?.savings || 0) >= 0
                ? 'text-blue-400'
                : 'text-red-400'
              }`}>
              ₹{summary?.savings?.toLocaleString() || 0}
            </p>
            <p className="text-gray-500 text-xs mt-1">This month</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${value}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-500">
              No transactions yet. Add one below.
            </div>
          )}
        </div>

        {/* AI Advisor */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg font-semibold">AI Financial Advisor</h2>
          </div>
          <AiAdvisor />
        </div>

        {/* Transactions */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <button
              onClick={() => {
                setError('')
                setShowForm(!showForm)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm 
                       font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {showForm ? 'Cancel' : '+ Add Transaction'}
            </button>
          </div>

          {/* Add Transaction Form */}
          {showForm && (
            <form onSubmit={handleAddTransaction}
              className="bg-gray-800 rounded-xl p-4 mb-4 
                           grid grid-cols-2 gap-3">
              {error && (
                <div className="col-span-2 bg-red-950/60 border border-red-800 text-red-400 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <input
                type="number"
                placeholder="Amount (₹)"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required
                className="bg-gray-700 border border-gray-600 rounded-lg 
                         px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
                className="bg-gray-700 border border-gray-600 rounded-lg 
                         px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500"
              />
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-lg 
           px-3 py-2 text-white text-sm
           focus:outline-none focus:border-blue-500"
              >
                <option value="auto">🤖 Auto (AI picks category)</option>
                <option value="food">Food</option>
                <option value="rent">Rent</option>
                <option value="entertainment">Entertainment</option>
                <option value="emi">EMI</option>
                <option value="salary">Salary</option>
                <option value="shopping">Shopping</option>
                <option value="health">Health</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded-lg 
                         px-3 py-2 text-white text-sm
                         focus:outline-none focus:border-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <button
                type="submit"
                disabled={saving}
                className="col-span-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         text-white font-medium py-2 rounded-lg 
                         transition-colors text-sm"
              >
                {saving ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          )}

          {/* Transaction List */}
          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No transactions yet. Add your first one above.
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx._id}
                  className="flex items-center justify-between 
                              bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full 
                                   ${categoryColors[tx.category] || 'bg-gray-500'}`}>
                    </span>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {tx.description}
                      </p>
                      <p className="text-gray-500 text-xs capitalize">
                        {tx.category} • {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${tx.type === 'income'
                        ? 'text-green-400'
                        : 'text-red-400'
                      }`}>
                      {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
                    </span>
                    <button
                      onClick={() => handleDelete(tx._id)}
                      className="text-gray-600 hover:text-red-400 
                               text-xs transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}