require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
var qpm = require('query-params-mongo')

const Store = require('./Store')
const Token = require('./controllers/Token')
const Offering = require('./controllers/Offering')
const Transaction = require('./controllers/Transaction')

const { multipleUpload } = require('./middleware/multer')

const main = async () => {
  const server = express()

  server.use(cors())
  server.use(bodyParser.urlencoded({ extended: true }))
  server.use(bodyParser.json())

  const store = new Store('mongodb://localhost:27017')
  await store.init()

  const processQuery = qpm()
  const token = new Token(store, processQuery)
  const offering = new Offering(store, processQuery)
  const transaction = new Transaction(store, processQuery)

  server.get('/tokens', async (req, res) => {
    const tokens = await token.get()
    res.json({
      success: 1,
      data: tokens
    })
  })

  server.post('/upload', multipleUpload, async (req, res) => {
    const files = req.files
    const response = await store.upload(files[0])
    res.json({
      data: response
    })
  })

  server.put('/tokens/:id', async (req, res) => {
    const tokenAddr = req.params.id
    const newToken = await token.updateDetail({
      tokenAddr: tokenAddr,
      address: req.body.address,
      businessOwner: {
        name: req.body.businessOwnerName,
        avatarUrl: req.body.businessOwnerAvatarUrl,
        bio: req.body.businessOwnerBio,
      },
      prospectusUrl: req.body.prospectusUrl,
      thumbnailListUrl: req.body.thumbnailListUrl,
    })
    res.json({
      success: 1,
      data: newToken
    })
  })

  server.get('/offerings', async (req, res) => {
    const offerings = await offering.get()
    res.json({
      success: 1,
      data: offerings
    })
  })

  server.get('/transactions', async (req, res) => {
    const txs = await transaction.get(req.query)
    res.json({
      success: 1,
      data: txs
    })
  })

  server.listen(8000, () => {
    console.log('Listening on PORT 8000')
  })
}

main()