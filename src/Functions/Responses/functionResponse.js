const Errors = requireMain('./errors');
const GlobalVariables = require('../globalVariables');

class FunctionResponse {
	constructor(params) {
		if (typeof params === 'string') {
			this.message = params;
			this._defaultInit(params);
		} else {
			this.message = params.message;
			this._paramsInit(params);
		}
	}
	
	_defaultInit() {
		// For deriving classes
	}
	
	_paramsInit(params) {
		// For deriving classes
	}
	
	send(funcResults) {
		let response = this._buildResponse(funcResults);
		this._sendImpl(response);
	}
	
	_buildResponse(context) {
		let result = this.message;
		
		context.variables.forEach(variable => {
			result = variable.consume(result, context);
		});
		
		GlobalVariables.forEach(variable => {
			result = variable.consume(result, context);
		});
		
		return result;
	}
	
	// noinspection JSUnusedLocalSymbols
	_sendImpl(finalText) {
		Errors.abstract();
	}
}

module.exports = FunctionResponse;
