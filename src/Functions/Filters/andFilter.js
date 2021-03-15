const FunctionFilter = require('./functionFilter');

class AndFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		this.filters = settings.filters || [];
	}
	
	get type() {
		return "and";
	}
	
	test(context) {
		return this.filters.reduce(
			(soFar, currentFilter) => soFar && currentFilter(context),
			true);
	}
}

module.exports = AndFilter;
