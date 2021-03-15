const Errors = requireMain('./errors');
const GlobalVariables = require('../globalVariables');
const replaceVariables = require('./MultiReplace/multiReplaceEngine');

class FunctionResponse {
	constructor(params) {
		if (typeof params === 'string') {
			this.enabled = true;
			this.message = params;
			this._defaultInit(params);
		} else {
			this.enabled = params.enabled !== false;
			this.message = params.message;
			this._paramsInit(params);
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
		let result = replaceVariables(allVars, this.message, context);
		
		// context.variables.forEach(variable => {
		// 	result = variable.consume(result, context);
		// });
		//
		// GlobalVariables.forEach(variable => {
		// 	result = variable.consume(result, context);
		// });
		//
		// if (context.outputPostProcessing) {
		// 	result = context.outputPostProcessing(result);
		// }
		
		return result;
	}
	
	// noinspection JSUnusedLocalSymbols
	_sendImpl(finalText) {
		Errors.abstract();
	}
}

module.exports = FunctionResponse;
