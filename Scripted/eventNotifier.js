const assert = require('assert').strict;

class EventNotifier {
	constructor() {
		this._eventHandlers = {};
	}
	
	_addEvent(eventName) {
		assert(!(eventName in this._eventHandlers),
			`Multiple registrations of event '${eventName}'`);
		
		this._eventHandlers[eventName] = [];
	}
	
	_addEvents(eventNames) {
		eventNames.forEach(eventName => this._addEvent(eventName));
	}
	
	on(eventName, callback) {
		assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	_notify(eventName, ...args) {
		assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		
		console.log(`Invoking event: ${eventName}`);
		this._eventHandlers[eventName].forEach(
			callback => callback.apply(null, args));
	}
}

module.exports = EventNotifier;
