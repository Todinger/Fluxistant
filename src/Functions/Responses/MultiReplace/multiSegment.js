const SearchSegment = require('./searchSegment');

class MultiSegment extends SearchSegment {
	constructor(parts) {
		super();
		this.parts = parts || [];
	}
	
	process(variable, context) {
		for (let i = 0; i < this.parts.length; i++) {
			this.parts[i] = this.parts[i].process(variable, context);
		}
		
		return this;
	}
	
	toString() {
		return this.parts.map(part => part.toString()).join('');
	}
}

module.exports = MultiSegment;
