const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');

class DynamicArrayEntity extends ConfigEntity {
	static get TYPE()		{ return 'DynamicArray'; 										}
	static get BUILDER()	{ return elementType => new DynamicArrayEntity(elementType); 	}
	
	constructor(elementType, allowImportingNewElements) {
		super(DynamicArrayEntity.TYPE);
		this.elementType = elementType || null;
		this.elements = [];
	}
	
	
	// ---- Overrides ---- //
	
	importDesc(descriptor) {
		this.elementType = descriptor.elementType;
		assert(this.elementType, 'A DynamicArrayEntity must have an element type.');
		descriptor.elements.forEach(entryDesc => {
			let element = ConfigEntity.readEntity(entryDesc);
			this.addElement(element);
		});
	}
}

module.exports = DynamicArrayEntity;
