const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ArrayEntity extends ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(elementType) {
		super();
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
	
	addElements(values) {
		values.forEach(value => this.addElement(value));
	}
	
	removeElementAt(index) {
		this.elements.splice(index, 1);
	}
	
	forEach(func) {
		this.elements.forEach(func);
	}
	
	get length() {
		return this.elements.length;
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
	
	exportDesc() {
		let elementsDesc = this.elements.map(element => element.export());
		return {
			descriptor: {
				elementType: this.elementType,
				elements: elementsDesc,
			}
		};
	}
	
	validate() {
		super.validate();
		for (let i = 0; i < this.elements.length; i++) {
			this._performValidationStep(
				() => this.elements[i].validate(),
				`Element #${i + 1}`);
		}
	}
	
	cloneImpl() {
		let copy = EntityFactory.build(this.type, this.elementType);
		this.elements.forEach(element => copy.addElement(element.clone()));
		return copy;
	}
	
	buildFrom(descriptor) {
		assert(this.elements.length === 0, 'buildFrom called on a non-empty object.');
		
		this.elementType = descriptor.elementType;
		assert(this.elementType, 'An ArrayEntity must have an element type.');
		
		// Build the elements from the given array
		descriptor.elements.forEach(entryDesc => {
			let element = ConfigEntity.buildEntity(entryDesc);
			this.addElement(element);
		});
	}
}

module.exports = ArrayEntity;
