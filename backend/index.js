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
  await store.init()

  const token = new Token(store)
  const offering = new Offering(store)

  server.get('/tokens', async (req, res) => {
    const tokens = await token.get()
    res.json({
      success: 1,
      data: tokens
    })
  })

  server.put('/tokens/:id', async (req, res) => {
    const tokenAddr = req.params.id
    const newToken = await token.updateDetail({
      tokenAddr: tokenAddr,
      name: req.body.name,
      symbol: req.body.symbol,
      address: req.body.address,
      businessOwner: {
        name: req.body.businessOwnerName,
        avatarUrl: req.body.businessOwnerAvatarUrl,
        bio: req.body.businessOwnerBio,
      },
      // prospectusUrl,
      // thumbnailListUrl,
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

  server.listen(8000, () => {
    console.log('Listening on PORT 8000')
  })
}

main()