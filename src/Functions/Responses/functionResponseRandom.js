const FunctionResponse = require('./functionResponse');
const Utils = requireMain('./utils');
const Errors = requireMain('./errors');

class FunctionResponseRandom extends FunctionResponse {
	get type() {
		Errors.abstract();
	}

	get message() {
		return this.messages.length > 0 ? Utils.randomElement(this.messages) : "";
	}

	_defaultInit(message) {
		this.messages = [message];
	}
	
	_paramsInit(params) {
		this.messages = params.messages;
	}
}

module.exports = FunctionResponseRandom;
