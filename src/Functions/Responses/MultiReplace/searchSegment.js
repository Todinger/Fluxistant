const Errors = requireMain('errors');

class SearchSegment {
	constructor() {
	}
	
	// noinspection JSUnusedLocalSymbols
	process(variable, context) {
		Errors.abstract();
	}
	
	toString() {
		Errors.abstract();
	}
}

module.exports = SearchSegment;
