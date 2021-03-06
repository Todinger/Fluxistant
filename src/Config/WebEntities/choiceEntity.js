const assert = require('assert').strict;
const ConfigEntity = require('./configEntity');
const EntityFactory = require('../entityFactory');

class ChoiceEntity extends ConfigEntity {
	static get TYPE()		{ return null;		}	// Avoid construction (abstract type)
	static get GUITYPE()	{ return 'Choice'; 	}
	
	constructor() {
		super();
		this.options = {};
		this.selectedOption = null;
		this._optionChanged = () => this.eChanged();
	}
	
	getOptions() {
		return this.options;
	}
	
	_addOption(option, type) {
		assert(!(option in this.options), `Duplicate option type: ${option}`);
		this.options[option] = EntityFactory.build(type);
		this.options[option].optionName = option;
		this.options[option].eOnChanged(this._optionChanged);
		this.extendID(option, this.options[option]);
		this.eChanged();
	}
	
	_addOptions(options) {
		Object.keys(options).forEach(option => this._addOption(option, options[option]));
	}
	
	getOption(option) {
		return this.options[option];
	}
	
	forEach(func) {
		Object.keys(this.options).forEach(
			optionName => func(optionName, this.options[optionName]));
	}
	
	select(option) {
		assert(option in this.options, `Invalid type for choice: ${option}`);
		this.selectedOption = option;
		this.eChanged();
		return this.getSelection();
	}
	
	hasSelection() {
		return this.selectedOption !== null;
	}
	
	getSelection() {
		if (this.hasSelection()) {
			return this.options[this.selectedOption];
		} else {
			return null;
		}
	}
	
	
	// ---- Overrides ---- //
	
	setID(id) {
		super.setID(id);
		this.forEach((option, value) => this.extendID(option, value));
		return this;
	}
	
	toConf() {
		if (this.hasSelection()) {
			return this.getSelection().toConf();
		} else {
			return null;
		}
	}
	
	importDesc(descriptor, lenient) {
		// Every option in this.options should be an object that inherits from
		// choiceValueEntity, which inherently has an .option property in its
		// own descriptor, so we just use that instead of saving the type of
		// the selection ourselves (it'd be redundant data)
		Object.keys(descriptor.options).forEach(option => {
			if (option in this.options) {
				this.options[option].import(descriptor.options[option], lenient);
				this.options[option].optionName = option;
			} else if (!lenient) {
				throw `Unknown option: ${option}`;
			}
		});
		
		if (descriptor.selectedOption in this.options) {
			this.selectedOption = descriptor.selectedOption;
		} else {
			this.selectedOption = Object.keys(this.options)[0];
		}
	}
	
	exportDesc() {
		let result = {
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
	
	validate() {
		super.validate();
		Object.values(this.options).forEach(optionEntity => {
			this._performValidationStep(
				() => optionEntity.validate(),
				`${optionEntity.displayText} option`);
		});
	}
	
	cloneImpl() {
		let copy = EntityFactory.build(this.type);
		Object.keys(this.options).forEach(
			option => copy.options[option] = this.options[option].clone());
		copy.selectedOption = this.selectedOption;
		return copy;
	}
	
	buildFrom(descriptor) {
		// Every option in this.options should be an object that inherits from
		// choiceValueEntity, which inherently has an .option property in its
		// own descriptor, so we just use that instead of saving the type of
		// the selection ourselves (it'd be redundant data)
		assert(
			descriptor.selectedOption in this.options,
			`Unknown selected type for ${this.type}: ${descriptor.selectedOption}`);
		this.selectedOption = descriptor.selectedOption;
		Object.keys(descriptor.options).forEach(option => {
			this.options[option] = ConfigEntity.buildEntity(descriptor.options[option]);
		});
	}
	
	getDisplayName() {
		let displayName = super.getDisplayName();
		if (displayName) {
			if (this.hasSelection()) {
				return `${displayName} (${this.getSelection().getDisplayText()})`;
			}
		}
		
		return displayName;
	}
}

module.exports = ChoiceEntity;
