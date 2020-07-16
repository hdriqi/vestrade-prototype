class Token {
  constructor(store) {
    this.store = store
    this.db = this.store.client.db('eth-indexer')
  }

  async get() {
    const result = await this.db.collection('TokenCreated').find()
    const arr = await result.toArray()
    const transform = arr.map(data => {
      return {
        name: data.args.name,
        addr: data.args.addr,
      }
    })
    return transform
  }

  async newTokenDetail({
    
  }) {
    
  }
}

module.exports = Token