'use strict';
const assert = require('assert').strict;
const ioHook = require('iohook');
const _ = require('lodash');
const cli = require('./cliManager');
const Utils = require('./utils');

// Responsible for all keyboard interaction.
// Currently only supports registration of keyboard shortcuts, but feel free to
// to modify the _onKeyDown() and _onKeyUp() functions to do something if you
// need it.
// I haven't implemented if because I didn't need it, but a good addition would
// be to make this class inherit from EventNotifier and use this._notify() in
// those two functions to notify registered callbacks of these events.
class KeyboardManager {
	constructor() {
		// This is where we keep all the keyboard shortcuts
		this.shortcuts = {};
		
		// These are meant for debug purposes
		// If you want to see the keycode for specific keys, turn these on,
		// call start() and then run the server and press the keys you want to
		// check (I recommend using logAllUp rather than logAllDown since the
		// Down version will keep firing while you hold the key down)
		this.logAllDown = false;
		this.logAllUp = false;
		
		ioHook.on('keydown', event => this._onKeyDown(event));
		ioHook.on('keyup', event => this._onKeyUp(event));
	}
	
	// Registers a keyboard shortcut, making it invoke the given callback when
	// it is pressed.
	// 
	// Parameters:
	// 	name		Unique identifier for this shortcut.
	// 	shortcut	An array of keys which, when all of them are pressed
	// 				together, will cause the invocation of the registered
	// 				callback.
	// 	callback	Function to call when the shortcut is pressed.
	registerShortcut(name, shortcut, callback) {
		assert(!(name in this.shortcuts),
			`Multiple shortcuts registered for the name '${name}'`);
		
		// We basically just delegate this to the ioHook library
		let id = ioHook.registerShortcut(shortcut.map(sc => sc.value), callback);
		
		// We need to store the result of the registration if we want to later
		// unregister it, which is the reason for this collection
		this.shortcuts[name] = {
			name,
			shortcut,
			callback,
			id,
		};
		
		return this;
	}
	
	// Unregisters a previously registers keyboard shortcut.
	// 
	// Parameters:
	// name		The unique identifier that was used to register the shortcut.
	unregisterShortcut(name) {
		assert(name in this.shortcuts,
			`No shortcut registered by the name of '${name}`);
		
		ioHook.unregisterShortcut(this.shortcuts[name].id);
		delete this.shortcuts[name];
		
		return this;
	}
	
	// Enables the entire keyboard integration engine.
	// None of the registered keyboard shortcuts will work until this is called.
	start() {
		ioHook.start();
		
		cli.on('on', () => this.enableAllLogs());
		cli.on('off', () => this.disableAllLogs());
	}
	
	// Called when a key is held down.
	// 
	// Parameters:
	// event	Event information obtained from ioHook. Contains keycode and
	// 			such (see ioHook documentation for the full details).
	_onKeyDown(event) {
		if (this.logAllDown) {
			cli.log(`KeyDown Event: ${JSON.stringify(event)}`);
		}
	}
	
	// Called when a key is released.
	// 
	// Parameters:
	// event	Event information obtained from ioHook. Contains keycode and
	// 			such (see ioHook documentation for the full details).
	_onKeyUp(event) {
		if (this.logAllUp) {
			cli.log(`KeyUp Event: ${JSON.stringify(event)}`);
		}
	}
	
	onKeyDown(handler) {
		ioHook.on('keydown', handler);
	}
	
	removeKeyDownHandler(handler) {
		ioHook.removeListener('keydown', handler);
	}
	
	onKeyUp(handler) {
		ioHook.on('keyup', handler);
	}
	
	removeKeyUpHandler(handler) {
		ioHook.removeListener('keyup', handler);
	}
	
	enableAllLogs() {
		this.logAllDown = true;
		this.logAllUp = true;
	}
	
	disableAllLogs() {
		this.logAllDown = false;
		this.logAllUp = false;
	}
}

// ioHook currently doesn't implement shortcuts that well: if you register
// both 'Shift+1' and '1' as shortcuts and then press Shift+1, it fires
// the callback for the '1' shortcut as well, which is really wrong and we
// don't want that.
// This class implements keyboard shortcuts on its own using the keydown
// and keyup events. We'll be using this but keeping the original in case
// we want the original behavior for some reason later on.
class ManualShortcutsKeyboardManager extends KeyboardManager {
	constructor() {
		super();
		
		// This is where we keep all the keys that are currently pressed down
		this.keysDown = [];
	}
	
	_isShortcutActive(keys) {
		return this.keysDown.length === keys.length &&
			Utils.arraysHaveSameValues(this.keysDown, keys);
	}
	
	_invokeAllActiveShortcuts() {
		Object.values(this.shortcuts).forEach(shortcut => {
			if (this._isShortcutActive(shortcut.keys)) {
				shortcut.callback();
			}
		});
	}
	
	registerShortcut(name, shortcut, callback) {
		assert(!(name in this.shortcuts),
			`Multiple shortcuts registered for the name '${name}'`);
		
		this.shortcuts[name] = {
			keys: shortcut.map(sc => sc.value),
			callback: callback,
		};
		
		if (this._isShortcutActive(shortcut)) {
			callback();
		}
		
		return this;
	}
	
	unregisterShortcut(name) {
		assert(name in this.shortcuts,
			`No shortcut registered by the name of '${name}`);
		
		delete this.shortcuts[name];
		return this;
	}
	
	_onKeyDown(event) {
		super._onKeyDown(event);
		if (!this.keysDown.includes(event.keycode)) {
			this.keysDown.push(event.keycode);
			this._invokeAllActiveShortcuts();
		}
	}
	
	_onKeyUp(event) {
		super._onKeyUp(event);
		_.pull(this.keysDown, event.keycode);
	}
}

// module.exports = new KeyboardManager();
module.exports = new ManualShortcutsKeyboardManager();
