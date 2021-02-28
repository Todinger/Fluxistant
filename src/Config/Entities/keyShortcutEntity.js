const assert = require('assert').strict;
const DynamicArrayEntity = require('./dynamicArrayEntity');
const Enums = requireMain('./Enums');

class KeyShortcutEntity extends DynamicArrayEntity {
	static get TYPE()		{ return 'KeyShortcut'; 				    	}
	static get BUILDER()	{ return (...p) => new KeyShortcutEntity(...p);	}
	
	constructor(defaultKeys) {
		super('Key');
		// TODO: Switch to keyboard shortcut entity
		if (defaultKeys) {
			this.setKeys(defaultKeys);
		}
	}
	
	addKey(value) {
		return this.add(value);
	}
	
	setKeys(keys) {
		this.clear();
		keys.forEach(key => {
			this.addKey(key);
		});
	}
	
	export() {
		return super.export();
	}
	
	cloneImpl() {
		let copy = new KeyShortcutEntity();
		this.elements.forEach(element => copy.addElement(element.clone()));
		return copy;
	}
	
	validate() {
		super.validate();
		this.forEach(valueElement => {
			if (valueElement.isSet()) {
				let key = valueElement.getValue();
				if (key !== '') {
					assert(
						('VC_' + key) in Enums.KEYCODES,
						`Unknown keycode: ${key}`);
				}
			}
		});
	}
}

module.exports = KeyShortcutEntity;
