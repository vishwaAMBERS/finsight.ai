import { useState } from 'react'
import nodeApi from '../services/nodeApi'

export default function AiAdvisor() {
  const [message, setMessage] = useState('')
  const [advice, setAdvice] = useState('')
  const [loading, setLoading] = useState(false)

  const askAdvisor = async (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setLoading(true)

    try {
      const res = await nodeApi.post('/api/chat/advice', { message })
      setAdvice(res.data.advice)
    } catch (err) {
      setAdvice('Sorry, advisor is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={askAdvisor} className="flex gap-3 mb-4">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Ask anything... e.g. How can I save more this month?"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg 
                   px-4 py-2 text-white text-sm placeholder-gray-500
                   focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800
                   text-white text-sm font-medium px-4 py-2 
                   rounded-lg transition-colors"
        >
          {loading ? '...' : 'Ask'}
        </button>
      </form>

      {advice && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-300 leading-relaxed">{advice}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          'How can I save more this month?',
          'Where am I overspending?',
          'How should I invest ₹5000?'
        ].map(q => (
          <button
            key={q}
            onClick={() => setMessage(q)}
            className="text-xs text-gray-400 hover:text-blue-400 
                     border border-gray-700 hover:border-blue-500
                     px-3 py-1 rounded-full transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}