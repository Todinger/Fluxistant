const assert = require('assert').strict;
const FunctionFilter = require('./functionFilter');

class NotFilter extends FunctionFilter {
	constructor(settings) {
		super(settings);
		assert(
			settings.filter,
			`A Not filter requires a filter to reverse.`);
		
		this.filters = settings.filter;
	}
	
	get type() {
		return "not";
	}
	
	test(context) {
		return !this.filter.test(context);
	}
}

module.exports = NotFilter;
