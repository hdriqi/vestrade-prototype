const { MongoClient } = require('mongodb')
const qpm = require('query-params-mongo')
const AWS = require('aws-sdk')

const BUCKET_NAME = 'vestrade'
const IAM_USER_KEY = process.env.IAM_USER_KEY
const IAM_USER_SECRET = process.env.IAM_USER_SECRET

const s3 = new AWS.S3({
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
})

class Store {
  constructor(mongodbUrl) {
    this.mongodbUrl = mongodbUrl
    this.processQuery = qpm()
  }

  async init() {
    if (!this.client) {
      this.client = await MongoClient.connect(this.mongodbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      })
    }
  }

  async upload(file) {
    const id =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const newName = `${id}_${file.originalname}`
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: newName,
      Body: file.buffer,
      ACL: 'public-read'
    }

    return new Promise((resolve, reject) => {
      s3.putObject(params, function (perr, pres) {
        if (perr) {
          console.log("Error uploading data: ", perr)
          reject(perr)
        } else {
          resolve(`https://${BUCKET_NAME}.s3-ap-southeast-1.amazonaws.com/${newName}`)
        }
      })
    })

  }

  close() {
    if (this.client) {
      this.client.close()
    }
  }
}

module.exports = Store