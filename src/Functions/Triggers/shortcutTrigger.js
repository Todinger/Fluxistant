const assert = require('assert').strict;
const Trigger = require('./functionTrigger');
const KeyboardManager = requireMain('./keyboardManager');
const KEYCODES = require('../../Enums').KEYCODES;

function keyShortToLongForm(key) {
	assert(
		key !== 'CHAR_UNDEFINED',
		'Undefined key given for shortcut.');
	
	let keyCode = 'VC_' + key.toUpperCase();
	assert(
		keyCode in KEYCODES,
		`Unknown key: ${key}`);
	
	return KEYCODES[keyCode];
}

class ShortcutTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.keys = settings.keys || [];
	}
	
	get commandID() {
		return `<Trigger> ${this.triggerID}`;
	}
	
	_registerShortcutKey(index, keycodes) {
		KeyboardManager.registerShortcut(
			`<Trigger> ${this.triggerID} : ${index}`,
			keycodes,
			() => this._trigger({
				user: this.selfUser,
			})
		);
	}
	
	_unregisterShortcutKey(index) {
		KeyboardManager.unregisterShortcut(
			`<Trigger> ${this.triggerID} : ${index}`);
	}
	
	_activateImpl() {
		for (let i = 0; i < this.keys.length; i++) {
			let shortcutKeycodes = this.keys[i].map(keyShortToLongForm);
			this._registerShortcutKey(i, shortcutKeycodes);
		}
	}
	
	_deactivateImpl() {
		this.keys.forEach(keys => {
			for (let i = 0; i < keys.length; i++) {
				this._unregisterShortcutKey(i);
			}
		});
	}
}

module.exports = ShortcutTrigger;