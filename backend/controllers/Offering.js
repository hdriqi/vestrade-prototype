const BigNumber = require('bignumber.js')

class Offering {
  constructor(store) {
    this.store = store
    this.vestrade = this.store.client.db('vestrade')
  }

  async get(query) {
    const mongoQuery = this.store.processQuery(query)
    const result = await this.vestrade.collection('offering').find(mongoQuery.filter, {
      projection: {
        _id: 0
      }
    })
    const arr = await result.toArray()
    const final = arr.map(data => {
      Object.keys(data).forEach(k => {
        if (data[k].type === 'BigNumber') {
          data[k] = new BigNumber(data[k].value).toString(10)
        }
      })
      return data
    })
    return final
  }
}

module.exports = Offering