const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const distPath = path.join(__dirname, 'dist')
const indexPath = path.join(distPath, 'index.html')

if (!fs.existsSync(indexPath)) {
  console.error('ERROR: dist/index.html not found. Did the build step run?')
  console.error('Contents of', __dirname + ':', fs.readdirSync(__dirname).join(', '))
}

app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache')
    } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    }
  },
}))

// SPA fallback — only for navigation requests, not missing assets
app.get('*', (req, res) => {
  const ext = path.extname(req.path)
  if (ext && ext !== '.html') {
    // Asset request (e.g. .js, .css) that wasn't found by static middleware
    return res.status(404).send('Not found')
  }
  res.sendFile(indexPath)
})

const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Titanic Traitors running on port ${port}`)
})
