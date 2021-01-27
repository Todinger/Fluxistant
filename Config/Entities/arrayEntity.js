const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');

class ArrayEntity extends ConfigEntity {
	static get TYPE()		{ return 'Array'; 										}
	static get BUILDER()	{ return elementType => new ArrayEntity(elementType); 	}
	
	constructor(elementType) {
		// super(name, `${elementType}[]`);
		super(ArrayEntity.TYPE, () => new ArrayEntity());
		this.elementType = elementType || null;
		this.elements = [];
	}
	
	validateIndex(index) {
		assert(0 <= index && index < this.elements.length, `No array element at index ${index}.`);
	}
	
	validateType(value) {
		assert(value.type == this.elementType, `Bad array element: expected value of type '${this.elementType}', got value of type '${value.type}'`);
	}
	
	getElements() {
		return this.elements;
	}
	
	getElement(index) {
		this.validateIndex(index);
		return this.elements[index];
	}
	
	setElement(index, value) {
		this.validateIndex(index);
		this.validateType(value);
		this.elements[index] = value;
		return value;
	}
	
	addElement(value) {
		this.validateType(value);
		this.elements.push(value);
		return value;
	}
	
	map(func) {
		return this.elements.map(func);
	}
	
	
	// ---- Overrides ---- //
	
	toJSON() {
		let elementsJSON = this.elements.map(element => element.toJSON());
		let contents = elementsJSON.join();
		return `[ ${contents} ]`;
	}
	
	toConf() {
		return this.elements.map(element => element.toConf());
	}
	
	import(descriptor) {
		this.elementType = descriptor.elementType;
		assert(this.elementType, 'An ArrayEntity must have an element type.');
		descriptor.elements.forEach(entryDesc => {
			let element = ConfigEntity.readEntity(entryDesc);
			this.addElement(element);
		});
	}
	
	export() {
		let elementsDesc = this.elements.map(element => element.export());
		return {
			type: this.type,
			descriptor: {
				elementType: this.elementType,
				elements: elementsDesc,
			}
		};
	}
	
	validate() {
		this.elements.forEach(element => element.validate());
	}
	
	clone() {
		let copy = new ArrayEntity(this.elementType);
		this.elements.forEach(element => copy.addElement(element.clone()));
		return copy;
	}
	
	fromJSON() {
		this.setValue(JSON.parse(jsonValue));
	}
}

module.exports = ArrayEntity;
