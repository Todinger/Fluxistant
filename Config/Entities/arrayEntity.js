const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ArrayEntity extends ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type, elementType) {
		super(type);
		this.elementType = elementType || null;
		this.elements = [];
	}
	
	validateIndex(index) {
		assert(0 <= index && index < this.elements.length, `No array element at index ${index}.`);
	}
	
	validateType(value) {
		assert(
			value.type === this.elementType,
			`Bad array element: expected value of type '${this.elementType}', got value of type '${value.type}'`);
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
	
	clear() {
		this.elements = [];
	}
	
	map(func) {
		return this.elements.map(func);
	}
	
	
	// ---- Overrides ---- //
	
	toConf() {
		return this.elements.map(element => element.toConf());
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
		let copy = EntityFactory.build(this.type, this.elementType);
		this.elements.forEach(element => copy.addElement(element.clone()));
		return copy;
	}
}

module.exports = ArrayEntity;
