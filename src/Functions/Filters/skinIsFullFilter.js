const FunctionFilter = require('./functionFilter');

class SkinIsFullFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsFull";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.full);
	}
}

module.exports = SkinIsFullFilter;
