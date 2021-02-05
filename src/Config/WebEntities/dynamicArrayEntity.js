const assert = require('assert').strict;
const ArrayEntity = require('./arrayEntity');
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class DynamicArrayEntity extends ArrayEntity {
	static get TYPE()		{ return 'DynamicArray'; 										}
	static get GUITYPE()	{ return 'DynamicArray'; 										}
	static get BUILDER()	{ return elementType => new DynamicArrayEntity(elementType); 	}
	
	constructor(elementType) {
		super(DynamicArrayEntity.TYPE, elementType);
		this.elementType = elementType || null;
		this.elements = [];
	}
	
	createAndAddElement() {
		let newElement = EntityFactory.build(this.elementType);
		this.addElement(newElement);
		return newElement;
	}
	
	// ---- Overrides ---- //
	
	importDesc(descriptor) {
		this.elementType = descriptor.elementType;
		assert(this.elementType, 'A DynamicArrayEntity must have an element type.');
		
		// Override the contents of the array with those imported
		this.clear();
		descriptor.elements.forEach(entryDesc => {
			let element = ConfigEntity.readEntity(entryDesc);
			this.addElement(element);
		});
	}
}

module.exports = DynamicArrayEntity;
