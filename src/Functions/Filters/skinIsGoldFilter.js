const FunctionFilter = require('./functionFilter');

class SkinIsGoldFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsGold";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.variant === "Gold");
	}
}

module.exports = SkinIsGoldFilter;
