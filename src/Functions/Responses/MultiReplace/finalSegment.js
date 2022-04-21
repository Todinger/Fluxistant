const SearchSegment = require('./searchSegment');

class FinalSegment extends SearchSegment {
	constructor(text) {
		super();
		this.text = text;
	}
	
	process(variable, context) {
		// Do nothing, our result is already final
		return { result: this, reprocess: false };
	}
	
	toString() {
		return this.text;
	}
}

module.exports = FinalSegment;
