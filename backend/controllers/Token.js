class Token {
  constructor(store) {
    this.store = store
    this.indexer = this.store.client.db('eth-indexer')
    this.vestrade = this.store.client.db('vestrade')
  }

  async get() {
    const embed = [{
      col: 'detail',
      key: 'addr',
      targetCol: 'tokenDetail',
      targetKey: 'tokenAddr'
    }]

    const result = await this.indexer.collection('TokenCreated').find()
    const arr = await result.toArray()
    const transform = arr.map(data => {
      return {
        name: data.args.name,
        symbol: data.args.symbol,
        addr: data.args.addr,
      }
    })
    const finalResult = []
    for await (const d of transform) {
      if (embed &&  embed.length > 0) {
        for (const e of embed) {
          d[e.col] = await this.vestrade.collection(e.targetCol).findOne({
            [e.targetKey]: d[e.key]
          })
        }
      }
      finalResult.push(d)
    }
    return finalResult
  }

  async updateDetail({
    tokenAddr,
    name,
    symbol,
    address,
    businessOwner,
    prospectusUrl,
    thumbnailListUrl,
  }) {
    const result = await this.vestrade.collection('tokenDetail').findOneAndUpdate({
      tokenAddr: tokenAddr
    }, {
      $set: {
        tokenAddr: tokenAddr,
        name: name,
        symbol: symbol,
        address: address,
        businessOwner: businessOwner,
        prospectusUrl: prospectusUrl,
        thumbnailListUrl: thumbnailListUrl
      }
    }, {
      upsert: true
    })
    return result
  }
}

module.exports = Token