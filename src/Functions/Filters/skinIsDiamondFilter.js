const FunctionFilter = require('./functionFilter');

class SkinIsDiamondFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsDiamond";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.variant === "Diamond");
	}
}

module.exports = SkinIsDiamondFilter;
