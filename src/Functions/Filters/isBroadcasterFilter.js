const FunctionFilter = require('./functionFilter');

class IsBroadcasterFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "isBroadcaster";
	}
	
	test(context) {
		return context.user.isBroadcaster;
	}
}

module.exports = IsBroadcasterFilter;
