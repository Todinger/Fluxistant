const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ChoiceEntity extends ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type) {
		super(type);
		this.options = {};
		this.selectedValue = null;
	}
	
	getOptions() {
		return this.options;
	}
	
	_addOption(type) {
		assert(!(type in this.options), `Duplicate option type: ${type}`);
		this.options[type] = EntityFactory.build(type);
	}
	
	_addOptions(types) {
		types.forEach(type => this._addOption(type));
	}
	
	select(type) {
		assert(type in this.options, `Invalid type for choice: ${type}`);
		this.selectedValue = this.options[type];
		return this.selectedValue;
	}
	
	getSelection() {
		return this.selectedValue;
	}
	
	
	// ---- Overrides ---- //
	
	toJSON() {
		return JSON.stringify(this.selectedValue);
	}
	
	toConf() {
		if (this.selectedValue) {
			return this.selectedValue.toConf();
		} else {
			return null;
		}
	}
	
	importDesc(descriptor) {
		// Every option in this.options should be an object that inherits from
		// choiceValueEntity, which inherently has a .type property in its own
		// descriptor, so we just use that instead of saving the type of the
		// selection ourselves (it'd be redundant data)
		let selectedType = descriptor.type;
		assert(
			selectedType in this.options,
			`Unknown selected type for ${this.type}: ${selectedType}`);
		
		this.options[selectedType].import(descriptor);
	}
	
	export() {
		return {
			type: this.type,
			descriptor: this.selectedValue.export(),
		};
	}
	
	clone() {
		let copy = new ChoiceEntity(this.type);
		this.options.forEach(option => copy._addOption(option.clone()));
		copy.selectedValue = copy.options[this.selectedValue.type];
		return copy;
	}
}

module.exports = ChoiceEntity;
