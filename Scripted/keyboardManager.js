'use strict';
const assert = require('assert').strict;
const ioHook = require('iohook');

class KeyboardManager {
	constructor() {
		this.shortcuts = {};
		this.logAllDown = false;
		this.logAllUp = false;
		
		ioHook.on('keydown', event => this._onKeyDown(event));
		ioHook.on('keyup', event => this._onKeyUp(event));
	}
	
	registerShortcut(name, shortcut, callback) {
		assert(!(name in this.shortcuts),
			`Multiple shortcuts registered for the name '${name}'`);
		
		let id = ioHook.registerShortcut(shortcut, callback);
		
		this.shortcuts[name] = {
			name,
			shortcut,
			callback,
			id,
		};
		
		return this;
	}
	
	unregisterShortcut(name) {
		assert(name in this.shortcuts,
			`No shortcut registered by the name of '${name}`);
		
		ioHook.unregisterShortcut(this.shortcuts[name].id);
		delete this.shortcuts[name];
		
		return this;
	}
	
	start() {
		ioHook.start();
	}
	
	_onKeyDown(event) {
		if (this.logAllDown) {
			console.log('KeyDown Event:');
			console.log(event);
		}
	}
	
	_onKeyUp(event) {
		if (this.logAllUp) {
			console.log('KeyUp Event:');
			console.log(event);
		}
	}
}

module.exports = new KeyboardManager();
