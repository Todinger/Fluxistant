
// General event notification class.
// Lets you use on(...) and invokes registered callbacks upon _notify(...).
// This class has no logic for the events it notifies about. It's meant to be
// inherited and used by the deriving class to notify about events without the
// deriving class needing to deal with registration and invocation.
export default class EventNotifier {
	constructor(ignoreCase) {
		// This is where we store the handlers (callbacks) of all the events
		// we support
		this._eventHandlers = {};
		
		// If enabled, makes all events case-insensitive
		this._ignoreCase = ignoreCase;
	}
	
	// Adds support for an event by the given name.
	_addEvent(eventName) {
		// If we ignore letter casing then we make everything lower-case
		// internally
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		console.assert(!(eventName in this._eventHandlers),
			`Multiple registrations of event '${eventName}'`);
		
		this._eventHandlers[eventName] = [];
	}
	
	// Utility function for adding multiple events at once
	_addEvents(eventNames) {
		eventNames.forEach(eventName => this._addEvent(eventName));
	}
	
	// Registers a callback to be invoked when an event occurs.
	on(eventName, callback) {
		// If we ignore letter casing then we make everything lower-case
		// internally
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		if (!(eventName in this._eventHandlers)) {
			this._eventHandlers[eventName] = [];
		}
		
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	// Removes a callback from the list for the given event
	removeCallback(eventName, callback) {
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		if (eventName in this._eventHandlers) {
			_.pull(this._eventHandlers[eventName], callback);
		} else {
			console.warn(`Cannot remove event handler for nonexistent event "${eventName}"`);
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
	_notify(eventName, ...args) {
		// If we ignore letter casing then we make everything lower-case
		// internally
		if (this._ignoreCase) {
			eventName = eventName.toLowerCase();
		}
		
		if (!(eventName in this._eventHandlers)) {
			this._eventHandlers[eventName] = [];
		}
		
		this._eventHandlers[eventName].forEach(
			callback => callback.apply(null, args));
	}
}
