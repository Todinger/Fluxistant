const assert = require('assert').strict;
const ArrayEntity = require('./arrayEntity');

class FixedArrayEntity extends ArrayEntity {
	static get TYPE()		{ return 'FixedArray'; 										}
	static get GUITYPE()	{ return 'FixedArray'; 										}
	static get BUILDER()	{ return elementType => new FixedArrayEntity(elementType); 	}
	
	constructor(elementType) {
		super(elementType);
		this.elementType = elementType || null;
		this.elements = [];
	}
	
	
	// ---- Overrides ---- //
	
	importDesc(descriptor, lenient) {
		let elementType = descriptor.elementType;
		if (lenient && elementType !== this.elementType) {
			elementType = this.elementType;
		}
		
		assert(
			elementType,
			'A FixedArrayEntity must have an element type.');
		
		assert(
			lenient || descriptor.elements.length === this.elements.length,
			`A FixedArrayEntity configuration must have the same number of elements as the original (expected ${this.elements.length}, got ${descriptor.elements.length}).`)
		
		let importLength = Math.min(this.elements.length, descriptor.elements.length);
		for (let i = 0; i < importLength; i++) {
			if (descriptor.elements[i].type === this.elements[i].type) {
				this.elements[i].import(descriptor.elements[i], lenient);
			} else if (!lenient) {
				throw `Element types in a FixedArrayEntity configuration must match the types of the original configuration.`;
			}
		}
	}
}

module.exports = FixedArrayEntity;
