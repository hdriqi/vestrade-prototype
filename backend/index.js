const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const Store = require('./Store')
const Token = require('./controllers/Token')
const Offering = require('./controllers/Offering')

const main = async () => {
  const server = express()

  server.use(cors())
  server.use(bodyParser.urlencoded({ extended: true }))
  server.use(bodyParser.json())

  const store = new Store('mongodb://localhost:27017')
  store.init()

  const token = new Token(store)
  const offering = new Offering(store)

  server.get('/tokens', async (req, res) => {
    const tokens = await token.get()
    res.json({
      success: 1,
      data: tokens
    })
  })

  server.get('/offerings', async (req, res) => {
    const offerings = await offering.get()
    res.json({
      success: 1,
      data: offerings
    })
  })
  
  server.listen(8000, () => {
    console.log('Listening on PORT 8000')
  })
}

main()