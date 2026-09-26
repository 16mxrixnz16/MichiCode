const http = require('http')

const PORT = process.env.PORT || 4321

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'ok' }))
  }
  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => console.log(`ok-node-app escuchando en http://localhost:${PORT}`))
