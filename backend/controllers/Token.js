class Token {
  constructor(store) {
    this.store = store
    this.indexer = this.store.client.db('eth-indexer')
    this.vestrade = this.store.client.db('vestrade')
  }

  async get() {
    const result = await this.vestrade.collection('tokenDetail').find()
    const arr = await result.toArray()
    return arr
  }

  async updateDetail({
    tokenAddr,
    address,
    businessOwner,
    prospectusUrl,
    thumbnailListUrl,
  }) {
    const result = await this.vestrade.collection('tokenDetail').findOneAndUpdate({
      tokenAddr: tokenAddr
    }, {
      $set: {
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