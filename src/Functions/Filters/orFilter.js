const FunctionFilter = require('./functionFilter');

class OrFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		this.filters = (settings && settings.filters) || [];
	}
	
	get type() {
		return "or";
	}

	get isEmpty() {
		return this.filters.length === 0;
	}
	
	getSubFilters() {
		return this.filters;
	}
	
	test(context) {
		return this.filters.length === 0 ||
			this.filters.reduce(
				(soFar, currentFilter) => soFar || currentFilter.test(context),
				false);
	}
}

module.exports = OrFilter;
