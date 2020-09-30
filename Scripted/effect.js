const User = require('./user');
const TwitchManager = require('./twitchManager');
const Enums = require('./enums');
const KeyboardManager = require('./keyboardManager');
const Assets = require('./assets');
const CommandManager = require('./commandManager');
const SEManager = require('./seManager');
const Log = require('./logger');

class Effect {
	constructor(description) {
		this.name = description.name;
		this.webname = description.webname;
		this.source = description.source;
		this.zindex = description.zindex;
		this.tags = description.tags;
		this.effectManager = null;
		this.commandManager = new CommandManager(this);
		this.dblog = Log;
		
		// Do not set these two; they are set by EffectManager
		// after the effect has finished construction and validation
		// (before the load() function is invoked)
		this.effectManager = null;
		this.workdir = null;
		
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
	
	// Invoked after creation and assignment of basic values by EffectManager
	load() {
		// Do nothing by default (for overriding where needed)
	}
	
	// Invoked for all effects after all load() functions have been called
	postload() {
		// Do nothing by default (for overriding where needed)
	}
	
	// Invoked manually, meant to have all commands reload any data they may
	// have - namely, if there are any command files loaded into commandManager,
	// they should be reloaded
	reloadData() {
		// Do nothing by default (for overriding where needed)
	}
	
	getCommandId(cmdname) {
		return `<${this.name}> ${cmdname}`;
	}
	
	registerCommand(cmdname, filters, callback, cost, descriptionFunc) {
		TwitchManager.registerCommand(
			this.getCommandId(cmdname),
			cmdname,
			filters,
			callback,
			cost,
			descriptionFunc);
	}
	
	unregisterCommand(cmdname) {
		TwitchManager.unregisterCommand(this.getCommandId(cmdname));
	}
	
	attachClient(socket) {
		this._connectedClients[socket.id] = socket;
		socket.on('disconnect', () => {
			this._clientDisconnectedHandlers.forEach(handler => handler(socket));
			delete this._connectedClients[socket.id];
		});
		this._clientAttachedHandlers.forEach(handler => handler(socket));
		this.log(`Client attached.`);
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
	
	say(msg) {
		TwitchManager.say(msg);
	}
	
	tell(user, msg) {
		TwitchManager.tell(user, msg);
	}
	
	_printForm(message) {
		return `[${this.name}] ${message}`;
	}
	
	log(message) {
		console.log(this._printForm(message));
	}
	
	warn(message) {
		console.warn(this._printForm(message));
	}
	
	error(message) {
		console.error(this._printForm(message));
	}
	
	static get Filters() {
		return User.Filters;
	}
	
	static get Keycodes() {
		return Enums.KEYCODES;
	}
	
	static get Assets() {
		return Assets;
	}
	
	static get USERPOINTS_NAME() {
		return SEManager.POINTS_NAME;
	}
}

module.exports = Effect;
