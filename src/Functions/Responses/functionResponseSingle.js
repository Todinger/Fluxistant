const FunctionResponse = require('./functionResponse');
const Errors = requireMain('./errors');

class FunctionResponseSingle extends FunctionResponse {
	get type() {
		Errors.abstract();
	}

	get message() {
		return this.singleMessage;
	}

	_defaultInit(message) {
		this.singleMessage = message;
	}
	
	_paramsInit(params) {
		this.singleMessage = params.message;
	}
}

module.exports = FunctionResponseSingle;
