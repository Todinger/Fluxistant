const assert = require('assert').strict;
const ArrayEntity = require('./arrayEntity');

class FixedArrayEntity extends ArrayEntity {
	static get TYPE()		{ return 'FixedArray'; 										}
	static get GUITYPE()	{ return 'FixedArray'; 										}
	static get BUILDER()	{ return elementType => new FixedArrayEntity(elementType); 	}
	
	constructor(elementType) {
		super(FixedArrayEntity.TYPE, elementType);
		this.elementType = elementType || null;
		this.elements = [];
	}
	
	
	// ---- Overrides ---- //
	
	importDesc(descriptor) {
		this.elementType = descriptor.elementType;
		assert(
			this.elementType,
			'A FixedArrayEntity must have an element type.');
		
		assert(
			descriptor.elements.length === this.elements.length,
			`A FixedArrayEntity configuration must have the same number of elements as the original (expected ${this.elements.length}, got ${descriptor.elements.length}).`)
		
		for (let i = 0; i < this.elements.length; i++) {
			assert(
				descriptor.elements[i].type === this.elements[i].type,
				`Element types in a FixedArrayEntity configuration must match the types of the original configuration.`);
			
			this.elements[i].import(descriptor.elements[i]);
		}
	}
}

module.exports = FixedArrayEntity;
