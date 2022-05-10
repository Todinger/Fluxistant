const FunctionFilter = require('./functionFilter');

class IsVIPFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "isVIP";
	}
	
	test(context) {
		return context.user.isVIP || context.user.isBroadcaster;
	}
}

module.exports = IsVIPFilter;
