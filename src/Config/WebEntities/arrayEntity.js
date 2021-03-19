const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ArrayEntity extends ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(elementType) {
		super();
		this.elementType = elementType || null;
		this.elements = [];
		this._elementChanged = () => this.eChanged();
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
	
	addElement(value) {
		this.validateType(value);
		this.elements.push(value);
		this.extendID(this.elements.length - 1, value);
		value.setDisplayName(`#${this.length}`);
		value.eOnChanged(this._elementChanged);
		
		this.eChanged();
		
		return value;
	}
	
	add(...params) {
		let buildParams = params;
		buildParams.unshift(this.elementType);
		return this.addElement(EntityFactory.build.apply(EntityFactory, buildParams));
	}
	
	addElements(values) {
		values.forEach(value => this.addElement(value));
	}
	
	removeElementAt(index) {
		assert(
			0 <= index && index < this.elements.length,
			`Invalid Array Entity element index: ${index}`);
		
		this.elements[index].eOnChangedRemove(this._elementChanged);
		this.elements.splice(index, 1);
		for (; index < this.length; index++) {
			this.extendID(index, this.elements[index]);
		}
		
		this.eChanged();
	}
	
	forEach(func) {
		this.elements.forEach(func);
	}
	
	get length() {
		return this.elements.length;
	}
	
	clear() {
		this.elements = [];
		this.eChanged();
	}
	
	map(func) {
		return this.elements.map(func);
	}
	
	
	// ---- Overrides ---- //
	
	setID(id) {
		super.setID(id);
		for (let i = 0; i < this.elements.length; i++) {
			this.extendID(i, this.elements[i]);
		}
		
		return this;
	}
	
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
		this.elements.forEach(element => copy.elements.push(element.clone()));
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
