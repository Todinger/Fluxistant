const FunctionResponseSingle = require('./functionResponseSingle');
const SEManager = requireMain('./seManager');

class SEResponse extends FunctionResponseSingle {
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
