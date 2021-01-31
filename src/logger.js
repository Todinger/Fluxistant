// This is used to log events in a database.
// Everything here is hard-coded at the moment, but there isn't much to begin
// with, so just change these details to fit your own database.
const dblogger = require('node-db-logger').createLogger({
	// config 
	mongo: {
		url     : 'mongodb://localhost:27017',
		options : {
			useUnifiedTopology: true
		},
		database: 'Scripted-Modules',
		collection: 'Logs'
	}
});

// A wrapper class to facilitate writing to the database.
// The dblogger defined above has one method, .record(), which takes as its
// first argument the category of the entry, which is one of: info, error, warn,
// debug and trace.
// Here we make an object that has a corresponding function for each such event,
// along with the regular .record() method.
// In other words, to make an info log entry for example, you can invoke
// logger.info('Some message'), but logger.record('info', 'Some message') will
// do the exact same thing.
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
