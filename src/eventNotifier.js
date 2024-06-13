const assert = require('assert').strict;
const _ = require('lodash');
const Globals = require('./globals');
const Logger = require('./logger');

// General event notification class.
// Lets you use on(...) and invokes registered callbacks upon _notify(...).
// This class has no logic for the events it notifies about. It's meant to be
// inherited and used by the deriving class to notify about events without the
// deriving class needing to deal with registration and invocation.
class EventNotifier {
	constructor(allowDynamicEvents, ignoreCase, silent) {
		// If enabled, when the .on() function is called, if the given event
		// does not exist, we add it instead of throwing an error
		this.allowDynamicEvents = allowDynamicEvents;
		
		// If enabled, makes all events case-insensitive
		this._ignoreCase = ignoreCase;
		
		// This is where we store the handlers (callbacks) of all the events
		// we support
		this._eventHandlers = {};
		
		// Silent mode means it doesn't alert about events being fired
		this.silent = silent === true || silent === undefined;
	}
	
	// Adds support for an event by the given name.
	_addEvent(eventName) {
		// If we ignore letter casing then we make everything lower-case
		// internally
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		assert(!(eventName in this._eventHandlers),
			`Multiple registrations of event '${eventName}'`);
		
		this._eventHandlers[eventName] = [];
	}
	
	// Utility function for adding multiple events at once
	_addEvents(eventNames) {
		eventNames.forEach(eventName => this._addEvent(eventName));
	}
	
	// Registers a callback to be invoked when an event occurs.
	_onSingle(eventName, callback) {
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
	
	// Registers a callback to be invoked when one or more events occur.
	on(eventNames, callback) {
		if (Array.isArray(eventNames)) {
			eventNames.forEach(
				eventName => this._onSingle(eventName, callback));
		} else {
			this._onSingle(eventNames, callback);
		}
	}
	
	// Removes a callback from the list for the given event
	removeCallback(eventName, callback, ignoreMissing = false) {
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		if (eventName in this._eventHandlers) {
			_.pull(this._eventHandlers[eventName], callback);
		} else if (!ignoreMissing) {
			Logger.warn(`Cannot remove event handler for nonexistent event "${eventName}"`);
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
	// 		(hello, world) => cli.log(`${hello} ${world}`));
	// Of course, if you don't care about the arguments you don't need to use
	// them. This would work fine too:
	// 	somethingThatDerivesFromEventNotifier.on(
	// 		'helloWorld',
	// 		() => cli.log(`Someone said hello world!`));
	_notify(eventName, ...args) {
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		// assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		
		if (eventName in this._eventHandlers) {
			if (!this.silent) {
				Globals.cli.log(`Invoking event: ${eventName}`);
			}
			
			this._eventHandlers[eventName].forEach(
				callback => callback.apply(null, args));
		}
	}
	
	_isEvent(eventName) {
		return eventName in this._eventHandlers;
	}
}

module.exports = EventNotifier;
