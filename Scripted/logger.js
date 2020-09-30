const dblogger = require('node-db-logger').createLogger({
	// config 
	mongo: {
		url     : 'mongodb://localhost:27017',
		options : {
			useUnifiedTopology: true
		},
		database: 'Scripted-Effects',
		collection: 'Logs'
	}
});

class Logger {
	constructor() {
		this._addLogMethod('info');
		this._addLogMethod('error');
		this._addLogMethod('warn');
		this._addLogMethod('debug');
		this._addLogMethod('trace');
	}
	
	_addLogMethod(name) {
		this[name] = function(...theArgs) {
			theArgs.unshift(name);
			return dblogger.record.apply(dblogger, theArgs);
		}
	}
	
	record(...theArgs) {
		return dblogger.record.apply(dblogger, theArgs);
	}
}

module.exports = new Logger();
