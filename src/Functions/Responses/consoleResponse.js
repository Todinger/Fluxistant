const FunctionResponse = require('./functionResponse');
const Logger = require('../../logger');

class ConsoleResponse extends FunctionResponse {
	constructor(params) {
		super(params);
	}
	
	get type() {
		return 'console';
	}
	
	_defaultInit() {
		this.level = 'info';
	}
	
	_paramsInit(params) {
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
