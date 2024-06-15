const FunctionFilter = require('./functionFilter');

class SkinIsEpicFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
	}
	
	get type() {
		return "skinIsEpic";
	}
	
	test(context) {
		return Boolean(context.triggerParams && context.triggerParams.epic);
	}
}

module.exports = SkinIsEpicFilter;
