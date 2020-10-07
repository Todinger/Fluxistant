const assert = require('assert').strict;

class EventNotifier {
	constructor(allowDynamicEvents, ignoreCase) {
		// If enabled, when the .on() function is called, if the given event
		// does not exist, we add it instead of throwing an error
		this.allowDynamicEvents = allowDynamicEvents;
		
		// If enabled, makes all events case-insensitive
		this._ignoreCase = ignoreCase;
		
		this._eventHandlers = {};
	}
	
	_addEvent(eventName) {
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		assert(!(eventName in this._eventHandlers),
			`Multiple registrations of event '${eventName}'`);
		
		this._eventHandlers[eventName] = [];
	}
	
	_addEvents(eventNames) {
		eventNames.forEach(eventName => this._addEvent(eventName));
	}
	
	on(eventName, callback) {
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		assert(
			this.allowDynamicEvents || (eventName in this._eventHandlers),
			`Unknown event: ${eventName}`);
		
		if (!(eventName in this._eventHandlers)) {
			this._eventHandlers[eventName] = [];
		}
		
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	_notify(eventName, ...args) {
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		
		console.log(`Invoking event: ${eventName}`);
		this._eventHandlers[eventName].forEach(
			callback => callback.apply(null, args));
	}
}

module.exports = EventNotifier;
