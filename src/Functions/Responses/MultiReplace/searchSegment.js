const Errors = requireMain('errors');

class SearchSegment {
	constructor() {
	}
	
	// noinspection JSUnusedLocalSymbols
	process(variable, context) {
		Errors.abstract();
		return null;
	}
	
	toString() {
		Errors.abstract();
		return "";
	}
}

module.exports = SearchSegment;
