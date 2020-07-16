const BigNumber = require('bignumber.js')

class Offering {
  constructor(store) {
    this.store = store
  }

  async get() {
    const result = await this.store.client.db('eth-indexer').collection('OfferingEvent').find()
    const arr = await result.toArray()
    const transform = arr.map(data => {
      return {
        name: data.args.name,
        addr: data.args.addr,
        tokenAddr: data.args.tokenAddr,
        supply: new BigNumber(data.args.supply.value).toString(10),
        rate: new BigNumber(data.args.rate.value).toString(),
        startDate: new BigNumber(data.args.startDate.value).toString(),
        endDate: new BigNumber(data.args.endDate.value).toString(),
      }
    })
    return transform
  }
}

module.exports = Offering