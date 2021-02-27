const assert = require('assert').strict;
const Errors = require('./errors');

// A wrapper for setTimeout and setInterval that allows
// for dynamic changes to the time.
// This is a base class, inherited by two classes for
// setTimeout and setInterval respectively.
class Timer {
	constructor(callback, duration) {
		this.handle = null;
		this.callback = callback || null;
		if (callback && duration) {
			this.set(duration, callback);
		}
	}
	
	_clearImpl() {
		Errors.abstract();
	}
	
	// Stops the timer, preventing the callback from being invoked.
	clear() {
		if (this.handle) {
			this._clearImpl();
			this.handle = null;
		}
	}
	
	_setImpl(duration, callback) {
		Errors.abstract();
	}
	
	// Starts the timer, calling callback() in <duration> milliseconds.
	// Cancels the timer if it was already running.
	// If no callback is provided, the last callback that was wet will
	// be used.
	set(duration, callback) {
		this.clear();
		
		callback = callback || this.callback;
		assert(callback, 'Timer activated without a callback.');
		
		this.handle = this._setImpl(duration, callback);
		this.callback = callback;
	}
	
	// Changes an active timer to activate in <duration> milliseconds
	// from now, instead of when it was supposed to originally.
	// If <callback> is provided, the new callback will be used;
	// otherwise the one that was set previously will be used.
	change(duration, callback) {
		if (this.handle) {
			callback = callback || this.callback;
			this.set(duration, callback);
		}
	}
}

// Activates once and stops.
class OneShotTimer extends Timer {
	constructor(callback, duration) {
		super(callback, duration);
	}
	
	_clearImpl() {
		clearTimeout(this.handle);
	}
	
	_setImpl(duration, callback) {
		return setTimeout(
			() => {
				this.handle = null;
				callback();
			},
			duration);
	}
}

// Activates every set interval until stopped
class RepeatingTimer extends Timer {
	constructor(callback, duration) {
		super(callback, duration);
	}
	
	_clearImpl() {
		clearInterval(this.handle);
	}
	
	_setImpl(duration, callback) {
		return setInterval(callback, duration);
	}
}

const Timers = {
	oneShot: (callback, duration) => new OneShotTimer(callback, duration),
	repeating: (callback, duration) => new RepeatingTimer(callback, duration),
};

module.exports = Timers;
