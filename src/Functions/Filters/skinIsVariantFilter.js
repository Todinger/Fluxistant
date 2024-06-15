const FunctionFilter = require('./functionFilter');

class SkinIsVariantFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsVariant";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.variant);
	}
}

module.exports = SkinIsVariantFilter;
