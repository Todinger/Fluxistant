const MongoClient = require('mongodb').MongoClient

let __db

class Mongo {
  constructor (config) {
    this.database = config.database || null
    if (this.database === null) throw new Error('config.mongo.database missing!')

    this.config     = config
    this.collection = config.collection || 'logs'
    this.options = config.options || {}
  }

  openMongoConnection (cb) {
    //only one connection at time
    if (__db) return cb(__db)

    MongoClient.connect(this.config.url, this.options, (err, client) => {
      if (err) {
        throw new Error(err.toString())
      }
      else {
        __db = client.db(this.config.database)
        cb(__db)
      }
    })
  }

  insertOne (type, identifier, data) {
    this.openMongoConnection(db => {
      db.collection(this.collection).insertOne({
        time: new Date(),
        identifier,
        type,
        data
      })
    })
  }

  deleteMany (type, identifier) {
    this.openMongoConnection(db => {
      let query = {}
      if (identifier !== false) query.identifier = identifier
      if (type) query.type = type
      db.collection(this.collection).deleteMany(query)
    })
  }
}

module.exports = Mongo
