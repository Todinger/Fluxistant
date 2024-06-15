const assert = require('assert').strict;
const ArrayEntity = require('./arrayEntity');
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class DynamicArrayEntity extends ArrayEntity {
	static get TYPE()		{ return 'DynamicArray'; 										}
	static get GUITYPE()	{ return 'DynamicArray'; 										}
	static get BUILDER()	{ return (...params) => new DynamicArrayEntity(...params);		}
	
	constructor(elementType, ...itemConstructionOptions) {
		super(elementType);
		this.elementType = elementType || null;
		this.elements = [];
		this.itemConstructionOptions = itemConstructionOptions;
	}
	
	createAndAddElement() {
		let constructionOptions = this.itemConstructionOptions || [];
		let newElement = EntityFactory.build(this.elementType, ...constructionOptions);
		this.addElement(newElement);
		return newElement;
	}
	
	// ---- Overrides ---- //
	
	importDesc(descriptor, lenient) {
		this.elementType = descriptor.elementType;
		assert(this.elementType, 'A DynamicArrayEntity must have an element type.');
		
		// Override the contents of the array with those imported
		this.clear();
		this.itemConstructionOptions = descriptor.itemConstructionOptions;
		descriptor.elements.forEach(entryDesc => {
			let element = ConfigEntity.readEntity(entryDesc, lenient, ...this.itemConstructionOptions);
			this.addElement(element);
		});
	}
	
	exportDesc() {
		let descriptor = super.exportDesc();
		descriptor.descriptor.itemConstructionOptions = this.itemConstructionOptions;
		return descriptor;
	}
	
	clone() {
		let copy = super.clone();
		copy.itemConstructionOptions = this.itemConstructionOptions;
		return copy;
	}
	
	_assignableFrom(type) {
		return super._assignableFrom(type) ||
			type === 'FixedArray';
	}
}

module.exports = DynamicArrayEntity;
