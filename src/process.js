'use strict';

const ffi = require('ffi-napi');
const ref = require('ref-napi');
const EventNotifier = require('./eventNotifier');
const Timers = require('./timers');

// Import Windows API functions
const user32 = new ffi.Library('user32', {
	'GetForegroundWindow': ['long', []],
	'GetWindowTextA': ['int', ['long', 'string', 'long']],
	'FindWindowA': ['int', ['string', 'string']],
});

class Process extends EventNotifier {
	static get DEFAULT_RUN_TEST_INTERVAL() { return 5000; }
	
	constructor(windowTitle) {
		super();
		this._addEvent('started');
		this._addEvent('exited');
		
		this.windowTitle = windowTitle;
		this.nameBuffer = Buffer.alloc(windowTitle.length + 2);
		
		this.processRunning = false;
		this.monitorTimer = Timers.repeating(
			() => this._refreshRunning(),
			Process.DEFAULT_RUN_TEST_INTERVAL);
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
	
	_refreshRunning() {
		let running = this.isRunning();
		if (running && !this.processRunning) {
			this._notify('started');
		} else if (!running && this.processRunning) {
			this._notify('exited');
		}
		
		this.processRunning = running;
	}
	
	startMonitoring(interval) {
		this.monitorTimer.set(interval || Process.DEFAULT_RUN_TEST_INTERVAL);
	}
	
	stopMonitoring() {
		this.monitorTimer.clear();
		this.processRunning = false;
	}
	
	onStarted(callback) {
		this.on('started', callback);
	}
	
	onExited(callback) {
		this.on('exited', callback);
	}
}

module.exports = Process;
