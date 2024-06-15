const FunctionFilter = require('./functionFilter');

class SkinIsFlagFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsFlag";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.flag);
	}
}

module.exports = SkinIsFlagFilter;
