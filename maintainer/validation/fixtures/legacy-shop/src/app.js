const express = require('express')
const { pool } = require('./db')
const Redis = require('ioredis')

const app = express()
const redis = new Redis(process.env.REDIS_URL)
app.use(express.json())

app.get('/api/products', async (req, res) => {
  const cached = await redis.get('products:all')
  if (cached) return res.json(JSON.parse(cached))
  const [rows] = await pool.query('SELECT id, name, price FROM product WHERE on_sale = 1')
  await redis.set('products:all', JSON.stringify(rows), 'EX', 60)
  res.json(rows)
})

app.post('/api/orders', async (req, res) => {
  const { product_id, quantity } = req.body
  const [result] = await pool.query('INSERT INTO orders (product_id, quantity) VALUES (?, ?)', [product_id, quantity])
  res.status(201).json({ id: result.insertId })
})

app.get('/healthz', (req, res) => res.send('ok'))

app.listen(process.env.PORT || 3000)
