import { useState } from 'react'
import nodeApi from '../services/nodeApi'

export default function UploadStatement({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (selectedFile) => {
    if (!selectedFile) return
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }
    setFile(selectedFile)
    setError('')
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }  

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await nodeApi.post('/api/upload/statement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setResult(res.data)
      setFile(null)
      onSuccess()  // refresh dashboard data

    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mt-8">
      <h2 className="text-lg font-semibold mb-2">📂 Upload Bank Statement</h2>
      <p className="text-gray-400 text-sm mb-4">
        Upload a CSV file — AI will categorize every transaction automatically
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center 
                   transition-colors cursor-pointer
                   ${dragOver 
                     ? 'border-blue-500 bg-blue-900/20' 
                     : 'border-gray-700 hover:border-gray-500'}`}
        onClick={() => document.getElementById('csv-input').click()}
      >
        <div className="text-4xl mb-2">📄</div>
        <p className="text-gray-400 text-sm">
          {file 
            ? `Selected: ${file.name}` 
            : 'Click or drag & drop your CSV file here'}
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Maximum 500 transactions, 5MB
        </p>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* CSV format hint */}
      <div className="mt-3 bg-gray-800 rounded-lg p-3">
        <p className="text-gray-400 text-xs font-medium mb-1">
          Expected CSV format:
        </p>
        <code className="text-green-400 text-xs">
          Date, Description, Amount, Type
        </code>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 bg-red-900/30 border border-red-700 
                      text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="mt-3 bg-green-900/30 border border-green-700 
                      text-green-400 px-4 py-3 rounded-lg text-sm">
          ✅ Imported {result.imported} transactions successfully
          {result.skipped > 0 && ` (${result.skipped} rows skipped)`}
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 
                   disabled:bg-blue-800 text-white font-medium 
                   py-3 rounded-lg transition-colors"
        >
          {loading 
            ? `Processing... (AI is categorizing)` 
            : `Upload ${file.name}`}
        </button>
      )}
    </div>
  )
}