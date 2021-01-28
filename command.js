const assert = require('assert').strict;
const UserFilters = require('./user').Filters;

class Command {
	constructor(data) {
		this.callback = data.callback;
		this.import(data);
	}
	
	import(data) {
		let cost = data.cost || 0;
		assert(cost >= 0, `Command ${data.cmdname} has a cost that isn't a non-negative integer.`);
		
		// this.enabled = data.enabled ?? true;
		// TODO: Change to ?? after updating Node.js to v14.
		this.enabled = data.enabled === undefined ? true : data.enabled;
		this.cmdname = data.cmdname;
		this.aliases = data.aliases || [];
		this.cost = data.cost || 0;
		this.cooldowns = data.cooldowns;
		this.filters = this.compileFilters(data.filters);
	}
	
	compileFilters(filterData) {
		if (filterData) {
			let userFilters = [];
			filterData.forEach(filter => {
				if (typeof filter === 'function') {
					userFilters.push(filter);
				} else {
					assert(filter.type, 'Bad filter for command: not a function or a filter descriptor.');
					userFilters.push(UserFilters.fromDataSingle(filter.type, filter.argument));
				}
			});
			
			return userFilters;
		}
	}
}

module.exports = Command;
