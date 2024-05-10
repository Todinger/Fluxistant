const FunctionResponseSingle = require('./functionResponseSingle');
const Logger = require('../../logger');

class ConsoleResponse extends FunctionResponseSingle {
	constructor(params) {
		super(params);
	}
	
	get type() {
		return 'console';
	}
	
	_defaultInit(message) {
		super._paramsInit(message);
		this.level = 'info';
	}
	
	_paramsInit(params) {
		super._paramsInit(params);
		this.level = params.level || 'info';
	}
	
	_sendImpl(finalText) {
		Logger.log({
			level: this.level,
			message: finalText,
		});
	}
}

module.exports = ConsoleResponse;
