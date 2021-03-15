const FunctionResponse = require('./functionResponse');
const SEManager = requireMain('./seManager');

class SEResponse extends FunctionResponse {
	constructor(params) {
		super(params);
	}
	
	get type() {
		return 'se';
	}
	
	_sendImpl(finalText) {
		SEManager.say(finalText);
	}
}

module.exports = SEResponse;
