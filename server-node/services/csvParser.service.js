const csv = require('csv-parser')
const { Readable } = require('stream')

const parseCSVBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = []

    // Convert buffer to readable stream
    const stream = Readable.from(buffer.toString())

    stream
      .pipe(csv())
      .on('data', (row) => {
        results.push(row)
      })
      .on('end', () => {
        resolve(results)
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}

module.exports = { parseCSVBuffer }