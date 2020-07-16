class Offering {
  constructor(store) {
    this.store = store
  }

  async get() {
    const result = await this.store.client.db('eth-indexer').collection('OfferingEvent').find()
    const arr = await result.toArray()
    const transform = arr.map(data => {
      return data.args
    })
    return transform
  }
}

module.exports = Offering