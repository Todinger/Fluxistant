const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ChoiceEntity extends ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type) {
		super(type);
		this.options = {};
		this.selectedValue = null;
		this.selectedOption = null;
	}
	
	getOptions() {
		return this.options;
	}
	
	_addOption(option, type) {
		assert(!(option in this.options), `Duplicate option type: ${option}`);
		this.options[option] = EntityFactory.build(type);
		this.options[option].optionName = option;
	}
	
	_addOptions(options) {
		Object.keys(options).forEach(option => this._addOption(option, options[option]));
	}
	
	select(option) {
		assert(option in this.options, `Invalid type for choice: ${option}`);
		this.selectedOption = option;
		return this.getSelection();
	}
	
	hasSelection() {
		return this.selectedOption !== null;
	}
	
	getSelection() {
		return this.options[this.selectedOption];
	}
	
	
	// ---- Overrides ---- //
	
	toJSON() {
		return JSON.stringify(this.selectedValue);
	}
	
	toConf() {
		if (this.hasSelection()) {
			return this.getSelection().toConf();
		} else {
			return null;
		}
	}
	
	importDesc(descriptor) {
		// Every option in this.options should be an object that inherits from
		// choiceValueEntity, which inherently has an .option property in its
		// own descriptor, so we just use that instead of saving the type of
		// the selection ourselves (it'd be redundant data)
		assert(
			descriptor.selectedOption in this.options,
			`Unknown selected type for ${this.type}: ${descriptor.selectedOption}`);
		this.selectedOption = descriptor.selectedOption;
		Object.keys(descriptor.options).forEach(option => {
			this.options[option].import(descriptor.options[option]);
		});
	}
	
	export() {
		let result = {
			type: this.type,
			descriptor: {
				selectedOption: this.selectedOption,
				options: {},
			},
		}
		
		Object.keys(this.options).forEach(option => {
			result.descriptor.options[option] = this.options[option].export();
		});
		
		return result;
	}
	
	clone() {
		let copy = EntityFactory.build(this.type);
		Object.keys(this.options).forEach(
			option => copy.options[option] = this.options[option].clone());
		copy.selectedOption = this.selectedOption;
		return copy;
	}
}

module.exports = ChoiceEntity;