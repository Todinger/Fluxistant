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

const DEFAULT_MAX_TITLE_LENGTH = 256;
const defaultBuffer = Buffer.alloc(DEFAULT_MAX_TITLE_LENGTH);

class Process extends EventNotifier {
	static get DEFAULT_RUN_TEST_INTERVAL() { return 5000; }
	
	static isWindowRunning(windowTitle) {
		return user32.FindWindowA(null, windowTitle) !== 0;
	}
	
	static isWindowActive(windowTitle, windowTitleBuffer) {
		windowTitleBuffer = windowTitleBuffer || defaultBuffer;
		let activeWindow = user32.GetForegroundWindow();
		user32.GetWindowTextA(
			activeWindow,
			windowTitleBuffer,
			windowTitleBuffer.length);
		let activeWindowTitle = ref.readCString(windowTitleBuffer, 0);
		return activeWindowTitle === windowTitle;
	}
	
	constructor(windowTitle, testInterval) {
		super(true);
		this._addEvent('started');
		this._addEvent('exited');
		
		this.windowTitle = windowTitle;
		this.nameBuffer = Buffer.alloc(windowTitle.length + 2);
		
		this.processRunning = false;
		this.processActive = false;
		
		if (testInterval === undefined) {
			testInterval = Process.DEFAULT_RUN_TEST_INTERVAL;
		}
		
		this.testInterval = testInterval;
		this.monitorTimer = Timers.repeating(
			() => this._refreshStatus(),
			this.testInterval);
	}
	
	setWindowTitle(windowTitle) {
		this.windowTitle = windowTitle;
	}
	
	isRunning() {
		return Process.isWindowRunning(this.windowTitle);
	}
	
	isActive() {
		return Process.isWindowActive(this.windowTitle, this.nameBuffer);
	}
	
	_refreshStatus() {
		let running = this.isRunning();
		if (running && !this.processRunning) {
			this._notify('started');
		} else if (!running && this.processRunning) {
			this._notify('exited');
		}
		this.processRunning = running;
		
		let active = this.isActive();
		if (active && !this.processActive) {
			this._notify('activated');
		} else if (!active && this.processActive) {
			this._notify('deactivated');
		}
		this.processActive = active;
	}
	
	startMonitoring(interval) {
		this.monitorTimer.set(interval || this.testInterval || Process.DEFAULT_RUN_TEST_INTERVAL);
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
	
	onActivated(callback) {
		this.on('activated', callback);
	}
	
	onDeactivated(callback) {
		this.on('deactivated', callback);
	}
}

module.exports = Process;
