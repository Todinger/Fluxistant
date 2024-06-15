const FunctionFilter = require('./functionFilter');

class SkinIsHoloFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsHolo";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.holo);
	}
}

module.exports = SkinIsHoloFilter;
