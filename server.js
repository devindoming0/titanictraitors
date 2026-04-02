const express = require('express')
const path = require('path')

const app = express()

// Serve the Vite build output
app.use(express.static(path.join(__dirname, 'app/dist')))

// SPA fallback — all routes return index.html so React Router handles them
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app/dist/index.html'))
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Titanic Traitors running on port ${port}`)
})
