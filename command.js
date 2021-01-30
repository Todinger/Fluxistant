const assert = require('assert').strict;
const UserFilters = require('./user').Filters;

class Variable {
	constructor(expr, replacement, replacementIsRegex) {
		assert(expr instanceof RegExp || typeof expr == 'string');
		this.expr = expr;
		
		assert(typeof replacement == 'string' || typeof replacement == 'function');
		if (typeof replacement == 'string' && !replacementIsRegex) {
			// Escape strings that aren't regular expressions
		}
		this.replacement = replacement;
	}
	
	consume(message, user) {
		if (this.expr instanceof RegExp) {
		
		}
	}
}

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
		this.enabled = data.enabled ?? true;
		this.cmdname = data.cmdname;
		this.aliases = data.aliases || [];
		this.message = data.message;
		this.cost = data.cost || 0;
		this.silent = data.silent;
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
	
	formatMessage(user, modVars) {
		let result = this.message;
		if (modVars) {
			// Object.keys(modVars).forEach(var => {
			//
			// });
		}
	}
}

module.exports = Command;
