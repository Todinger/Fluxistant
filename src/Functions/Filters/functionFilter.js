const Errors = requireMain('./errors');

class FunctionFilter {
	constructor(settings) {
	}
	
	get type() {
		Errors.abstract();
	}
	
	// noinspection JSUnusedLocalSymbols
	test(context) {
		return true;
	}
}

module.exports = FunctionFilter;
