const FunctionFilter = require('./functionFilter');

class OrFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		this.filters = settings.filters || [];
	}
	
	get type() {
		return "or";
	}
	
	test(context) {
		return this.filters.reduce(
			(soFar, currentFilter) => soFar || currentFilter(context),
			false);
	}
}

module.exports = OrFilter;
