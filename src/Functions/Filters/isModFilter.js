const FunctionFilter = require('./functionFilter');

class IsModFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "isMod";
	}
	
	test(context) {
		return context.user.isMod || context.user.isBroadcaster;
	}
}

module.exports = IsModFilter;
