const _ = require('lodash');

class MiniEventNotifier {
	constructor() {
		// This is where we store the handlers (callbacks) of all the events
		// we support
		this._eventHandlers = {};
	}
	
	_ensurePresence(eventName) {
		if (!(eventName in this._eventHandlers)) {
			this._eventHandlers[eventName] = [];
		}
	}
	
	// Registers a callback to be invoked when an event occurs.
	on(eventName, callback) {
		eventName = eventName.toLowerCase();
		
		this._ensurePresence(eventName);
		
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	// Removes a callback from the list for the given event
	removeCallback(eventName, callback) {
		eventName = eventName.toLowerCase();
		
		if (eventName in this._eventHandlers) {
			_.pull(this._eventHandlers[eventName], callback);
		}
	}
	
	// Invokes all the callbacks that registered for the specified event.
	// If the event has arguments, simply list them after the event name when
	// invoking this function.
	// E.g.:
	// 	this._notify('helloWorld', 'Hello', 'world!');
	// Correspondingly, all the callbacks registering to the same event should
	// accept these arguments, e.g.:
	// 	somethingThatDerivesFromEventNotifier.on(
	// 		'helloWorld',
	// 		(hello, world) => console.log(`${hello} ${world}`));
	// Of course, if you don't care about the arguments you don't need to use
	// them. This would work fine too:
	// 	somethingThatDerivesFromEventNotifier.on(
	// 		'helloWorld',
	// 		() => console.log(`Someone said hello world!`));
	notify(eventName, ...args) {
		eventName = eventName.toLowerCase();
		
		this._ensurePresence(eventName);
		
		this._eventHandlers[eventName].forEach(
			callback => callback(...args));
	}
	
	event(eventName) {
		this._ensurePresence(eventName);
		let onEvent = (callback) => this.on(eventName, callback);
		let notifyEvent = (...p) => this.notify(eventName, ...p);
		let unregister = (callback) => this.removeCallback(eventName, callback);
		return [
			onEvent,
			notifyEvent,
			unregister,
		];
	}
}

module.exports = MiniEventNotifier;
