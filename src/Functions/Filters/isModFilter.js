const FunctionFilter = require('./functionFilter');

class IsModFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "isMod";
	}
	
	test(context) {
		return context.user.isMod;
	}
}

module.exports = IsModFilter;
