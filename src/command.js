const assert = require('assert').strict;
const UserFilters = require('./user').Filters;
const GlobalVariables = require('./commandVariables');

class Command {
	constructor(module, data) {
		this.callback = data.callback;
		this.module = module;
		this.import(data);
	}
	
	import(data) {
		let cost = data.cost || 0;
		assert(cost >= 0, `Command ${data.cmdname} has a cost that isn't a non-negative integer.`);
		
		this.enabled = data.enabled ?? true;
		this.cmdname = data.cmdname;
		this.aliases = data.aliases || [];
		this.message = data.message;
		this.cost = data.cost || 0;
		// this.silent = data.silent;
		this.cooldowns = data.cooldowns;
		this.filters = this.compileFilters(data.filters);
		this.extras = {};
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
	
	createResponse(user, invocationData, commandData) {
		let result = this.message;
		
		// Module-specific variables take precedence over the global variables
		// (this lets modules override global variables)
		let modVars = this.module.variables;
		if (modVars) {
			Object.values(modVars).forEach(variable => {
				result = variable.consume(user, invocationData, commandData, result);
			});
		}
		
		GlobalVariables.forEach(variable => {
			result = variable.consume(user, invocationData, commandData, result);
		});
		
		return result;
	}
}

module.exports = Command;
