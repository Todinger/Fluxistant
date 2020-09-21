var User = require('./user');
var TwitchManager = require('./twitchManager');
var Enums = require('./enums');
var KeyboardManager = require('./keyboardManager');

class Effect {
	constructor(description) {
		this.name = description.name;
		this.webname = description.webname;
		this.source = description.source;
		this.zindex = description.zindex;
		this.effectManager = null;
		
		this._clientAttachedHandlers = [];
		this._clientDisconnectedHandlers = [];
		this._connectedClients = {};
	}
	
	_onClientAttached(handler) {
		this._clientAttachedHandlers.push(handler);
	}
	
	_onClientDisconnected(handler) {
		this._clientDisconnectedHandlers.push(handler);
	}
	
	load() {
		// Do nothing by default (for overriding where needed)
	}
	
	postload() {
		// Do nothing by default (for overriding where needed)
	}
	
	registerCommand(cmdname, filters, callback) {
		TwitchManager.onCommand(cmdname, filters, callback);
	}
	
	attachClient(socket) {
		this._connectedClients[socket.id] = socket;
		socket.on('disconnect', () => {
			this._clientDisconnectedHandlers.forEach(handler => handler(socket));
			delete this._connectedClients[socket.id];
		});
		this._clientAttachedHandlers.forEach(handler => handler(socket));
	}
	
	// Should check if a given command (= { cmdname, args }) is a command
	// for this effect, and if so, invoke it and return true - otherwise
	// it should return false (like it does here by default)!
	// Derive in concrete deriving classes that have complex commands (if a
	// command is simple you can use registerCommand or forwardSimpleCommand
	// for it; this is for more complex things, such as commands with dynamic
	// names, e.g. self-commands)
	invokeCommand(user, command) {
		return false;
	}
	
	broadcastEvent(eventName, args) {
		Object.values(this._connectedClients).forEach(socket => {
			socket.emit(eventName, args);
		});
	}
	
	onTwitchEvent(eventName, callback) {
		TwitchManager.on(eventName, callback);
	}
	
	// Simple = up to one argument
	forwardSimpleCommand(cmdname, filters) {
		this.registerCommand(cmdname, filters, (user, arg) => {
			this.broadcastEvent(cmdname, arg);
		});
	}
	
	// Simple = up to one argument
	forwardSimpleTwitchEvent(eventName) {
		this.onTwitchEvent(eventName, arg => {
			// Add the name of the event to 
			this.broadcastEvent(eventName, arg);
		});
	}
	
	registerShortcutKey(name, shortcut, callback) {
		KeyboardManager.registerShortcut(
			`${this.name}_${name}`,
			shortcut,
			callback);
	}
	
	unregisterShortcutKey(name, shortcut, callback) {
		KeyboardManager.unregisterShortcut(`${this.name}_${name}`);
	}
	
	static get Filters() {
		return User.Filters;
	}
	
	static get Keycodes() {
		return Enums.KEYCODES;
	}
}

module.exports = Effect;
