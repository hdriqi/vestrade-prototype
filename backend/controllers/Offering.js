const BigNumber = require('bignumber.js')
const { TemporaryCredentials } = require('aws-sdk')

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

  async getLaunchpad(query) {
    const mongoQuery = this.store.processQuery(query)
    const result = await this.vestrade.collection('offering').find(mongoQuery.filter, {
      projection: {
        _id: 0
      }
    })
    const arr = await result.toArray()
    const promiseFinal = arr.map(data => {
      return new Promise(async (resolve, reject) => {
        try {
          Object.keys(data).forEach(k => {
            if (data[k].type === 'BigNumber') {
              data[k] = new BigNumber(data[k].value).toString(10)
            }
          })
          data.detail = await this.vestrade.collection('tokenDetail').findOne({
            tokenAddr: data.tokenAddr
          }, {
            projection: {
              _id: 0
            }
          })
          resolve(data)
        } catch (err) {
          reject(err)
        }
      })
    })
    const final = await Promise.all(promiseFinal)
    return final
  }
}

module.exports = Offering