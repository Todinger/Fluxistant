const Mongo = require('./db/Mongo')

class Logger {
  constructor (config, identifier) {
    if (config.hasOwnProperty('mongo')) {
      this.db = new Mongo(config.mongo)
    }
    else {
      throw new Error('Database client not set!')
    }
    this.identifier = identifier || null
  }

  record (type, ...aData) {
    this.db.insertOne(type, this.identifier, this.normalize(aData))
  }

  delete (...types) {
    if(types.length > 0) {
      for (const type of types) {
        this.db.deleteMany(type, this.identifier)
      }
    }
    else {
      this.db.deleteMany(null, this.identifier)
    }
  }

  forceDelete (...types) {
    if(types.length > 0) {
      for (const type of types) {
        this.db.deleteMany(type, false)
      }
    }
    else {
      this.db.deleteMany(null, false)
    }
  }

  normalize (aData) {
    let arr = []
    for (let data of aData) {
      if (typeof data === 'string') {
        arr.push(data)
      }
      else {
        arr.push(JSON.stringify(data))
      }
    }
    return arr.join('')
  }
}

const __aLoggers = {}

module.exports = {
  createLogger (config, identifier = null) {
    if (typeof identifier === 'string') {
      return __aLoggers[identifier] = new Logger(config, identifier)
    }
    if (typeof config === 'string') {
      if (!__aLoggers.hasOwnProperty(config)) throw  new Error(`Manager '${config}' doesn't exists!`)
      return __aLoggers[config]
    }
    return new Logger(config)
  }
}
