const FunctionFilter = require('./functionFilter');

class IsSubFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "isSub";
	}
	
	test(context) {
		return context.user.isSub || context.user.isBroadcaster;
	}
}

module.exports = IsSubFilter;
