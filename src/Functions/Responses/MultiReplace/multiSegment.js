const SearchSegment = require('./searchSegment');

class MultiSegment extends SearchSegment {
	constructor(parts) {
		super();
		this.parts = parts || [];
	}
	
	process(variable, context) {
		let reprocessTotal = false;
		for (let i = 0; i < this.parts.length; i++) {
			let { result, reprocess } = this.parts[i].process(variable, context);
			this.parts[i] = result;
			reprocessTotal = reprocessTotal || reprocess;
		}
		
		return { result: this, reprocess: reprocessTotal };
	}
	
	toString() {
		return this.parts.map(part => part.toString()).join('');
	}
}

module.exports = MultiSegment;
