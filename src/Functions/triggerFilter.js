const Errors = require('../errors');

class TriggerFilter {
	constructor() {
	}
	
	test() {
		Errors.abstract();
	}
}

module.exports = TriggerFilter;
