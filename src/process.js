'use strict';

const ffi = require('ffi-napi');
const ref = require('ref-napi');

// Import Windows API functions
const user32 = new ffi.Library('user32', {
	'GetForegroundWindow': ['long', []],
	'GetWindowTextA': ['int', ['long', 'string', 'long']],
	'FindWindowA': ['int', ['string', 'string']],
});

class Process {
	constructor(windowTitle) {
		this.windowTitle = windowTitle;
		this.nameBuffer = Buffer.alloc(windowTitle.length + 2);
	}
	
	isRunning() {
		return user32.FindWindowA(null, this.windowTitle) !== 0;
	}
	
	isActive() {
		let activeWindow = user32.GetForegroundWindow();
		user32.GetWindowTextA(
			activeWindow,
			this.nameBuffer,
			this.nameBuffer.length);
		let activeWindowTitle = ref.readCString(this.nameBuffer, 0);
		return activeWindowTitle === this.windowTitle;
	}
}

module.exports = Process;
