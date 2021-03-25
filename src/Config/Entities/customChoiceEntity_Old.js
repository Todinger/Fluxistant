const assert = require('assert').strict;
const FixedArrayEntity = require('./fixedArrayEntity');
const StringEntity = require('./Values/stringEntity');

class CustomChoiceEntity_Old extends FixedArrayEntity {
	static get TYPE()		{ return 'CustomChoice'; 					}
	static get GUITYPE()	{ return 'CustomChoice'; 					}
	static get BUILDER()	{ return () => new CustomChoiceEntity_Old(); 	}
	
	constructor() {
		super('String');
		this.selectedIndex = -1;
	}
	
	addOption(option) {
		this.addElement(new StringEntity(option));
		this.eChanged();
	}
	
	addOptions(options) {
		Object.keys(options).forEach(option => this._addOption(option));
	}
	
	forEach(func) {
		super.forEach(optionEntity => func(optionEntity.getValue()));
	}
	
	getOption(index) {
		return this.getElement(index).getValue();
	}
	
	select(index) {
		assert(0 <= index && index < this.length, `Invalid choice index: ${index}`);
		this.selectedIndex = index;
		this.eChanged();
		return this.getSelection(index);
	}
	
	hasSelection() {
		return this.selectedIndex >= 0;
	}
	
	getSelection() {
		if (this.hasSelection()) {
			return this.getOption(this.selectedIndex);
		} else {
			return null;
		}
	}
	
	getSelectedIndex() {
		return this.selectedIndex;
	}
	
	
	// ---- Overrides ---- //
	
	toConf() {
		if (this.hasSelection()) {
			return this.getSelection().toConf();
		} else {
			return undefined;
		}
	}
	
	importDesc(descriptor, lenient) {
		super.importDesc(descriptor, lenient);
		this.selectedIndex = descriptor.selectedIndex;
	}
	
	cloneImpl() {
		let copy = super.cloneImpl();
		copy.selectedIndex = this.selectedIndex;
		return copy;
	}
	
	buildFrom(descriptor) {
		super.buildFrom(descriptor);
		this.selectedIndex = descriptor.selectedIndex;
	}
}

module.exports = CustomChoiceEntity_Old;
