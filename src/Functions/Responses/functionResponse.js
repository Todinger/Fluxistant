const Errors = requireMain('./errors');
const GlobalVariables = require('../globalVariables');
const replaceVariables = require('./MultiReplace/multiReplaceEngine');

class FunctionResponse {
	constructor(settings) {
		settings = settings || {};
		if (typeof settings === 'string') {
			this.enabled = true;
			this.message = settings;
			this._defaultInit(settings);
		} else {
			this.enabled = settings.enabled !== false;
			this.message = settings.message;
			this._paramsInit(settings);
		}
	}
	
	get type() {
		Errors.abstract();
	}
	
	_defaultInit() {
		// For deriving classes
	}
	
	_paramsInit(params) {
		// For deriving classes
	}
	
	send(funcResults) {
		if (this.enabled) {
			let response = this._buildResponse(funcResults);
			this._sendImpl(response);
		}
	}
	
	_buildResponse(context) {
		let allVars = [...context.variables].concat(GlobalVariables);
		return replaceVariables(allVars, this.message, context);
	}
	
	// noinspection JSUnusedLocalSymbols
	_sendImpl(finalText) {
		Errors.abstract();
	}
}

module.exports = FunctionResponse;
