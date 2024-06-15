const FunctionFilter = require('./functionFilter');

class SkinIsHeadFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsHead";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.head);
	}
}

module.exports = SkinIsHeadFilter;
