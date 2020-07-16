const { MongoClient } = require('mongodb')

class Store {
  constructor(mongodbUrl) {
    this.mongodbUrl = mongodbUrl
  }

  async init() {
    if (!this.client) {
      this.client = await MongoClient.connect(this.mongodbUrl, { 
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    }
  }

  close() {
    if (this.client) {
      this.client.close()
    }
  }
}

module.exports = Store