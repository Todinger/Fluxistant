const fs = require('fs');
const path = require('path');
const util = require('util');
const cli = require('./cliManager');
const User = require('./user');
const TwitchManager = require('./twitchManager');
const Enums = require('./enums');
const KeyboardManager = require('./keyboardManager');
const Assets = require('./assets');
const CommandManager = require('./commandManager');
const SEManager = require('./seManager');
const RewardsManager = require('./rewardsManager');
const Log = require('./logger')

// This is the base class for all server-side Effect-specific logic classes.
// 
// To create a new Effect, create a subdirectory within ./Effects/ from where
// this file is, add an "effect.js" file in it, require this file and inherit
// this class.
class Effect {
	// Pass an object in the super() call in the concrete Effect's constructor
	// to configure the effect.
	// The properties of the description object are as follows:
	// 	name		Unique name, can have spaces and such.
	// 	[enabled]	If set specifically to false, prevents the script from
	// 				being loaded at all (as if the file wasn't there).
	// 	[webname]	Web identifier. Should be URL-friendly.
	// 	[zindex]	Used by the effect aggragator page, ScriptedEffect, this
	// 				specifies th z-index of the Effect's frame on the page.
	// 				Use this to put things in front of or behind other things.
	// 	[tags]		This specifies you wish to attach to any client that
	// 				requests to connect to a server Effect by one of the tags
	// 				listed here. It is used for one-to-many connections between
	// 				display pages and scripts (e.g. multiple Effects wanting to
	// 				show images can attach to the 'imgdisp' tag that the
	// 				ImageDisplay Effect client attaches to).
	// 	[debug]		If set, using this.say() and this.tell() prints to the
	// 				console instead of sending to the Twitch channel chat.
	// 	
	// (Anything in [brackets] is optional.)
	// If the concrete Effect has a source, it also needs a webname, and when
	// the server is running, the URL of the Effect's HTML file will be
	// "/fx/webname/source" (e.g. http://localhost:3333/fx/hellow/world.html for
	// webname = "hello" and source = "world.html").
	constructor(description) {
		if (description.enabled === false) {
			this.enabled = false;
			return;
		} else {
			this.enabled = true;
		}
		
		this.name = description.name;
		this.webname = description.webname;
		this.source = description.source;
		this.zindex = description.zindex;
		this.tags = description.tags;
		
		// Utility objects
		this.effectManager = null;
		this.commandManager = new CommandManager(this);
		this.dblog = Log;
		
		// Do not set these two; they are set by EffectManager
		// after the effect has finished construction and validation
		// (before the load() function is invoked)
		this.effectManager = null;
		this.workdir = null;
		
		// Client management
		this._clientAttachedHandlers = [];
		this._clientDisconnectedHandlers = [];
		this._connectedClients = {};
		
		// Loads the effect in debug mode, replacing chat messages with
		// console log printouts
		if (description.debug) {
			this.say = this.log;
			this.tell = (user, msg) => {
				this.say(`@${user.displayName} ${msg}`);
			}
		}
		
		this.registerCommand({
			cmdname: 'fxvol',
			filters: [Effect.Filters.isOneOf(['fluxistence', 'yecatsmailbox'])],
			callback: (user, volume) => {
				this.broadcastEvent('fxvol', { username: user.name, volume });
			}
		});
	}
	
	// [For use by inheriting classes]
	// Invokes the given handler when a client is attached to this Effect.
	// The handler should accept a (socket) argument with the attached client.
	onClientAttached(handler) {
		this._clientAttachedHandlers.push(handler);
	}
	
	// [For use by inheriting classes]
	// Invokes the given handler when a client is detached from this Effect.
	// The handler should accept a (socket) argument with the detached client.
	onClientDisconnected(handler) {
		this._clientDisconnectedHandlers.push(handler);
	}
	
	// [For external use (by EffectManager), for override by inheriting classes]
	// Invoked after creation and assignment of basic values by EffectManager.
	preload() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by EffectManager), for override by inheriting classes]
	// Invoked after preload and whenever the effect is requested to reload its
	// data (only applicable to some effects, usually those that read files and
	// such).
	// If there are any command files loaded into commandManager, they should
	// be reloaded.
	// 
	// NOTE: ONLY SAVE VALID DATA!
	// If an Effect encounters an error while loading data, it should throw an
	// error and KEEP THE OLD DATA (if it has any).
	// This is so that when we reload data during runtime we can aslert the user
	// about faulty data and still keep running smoothly without crashing.
	loadData() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by EffectManager), for override by inheriting classes]
	// Invoked after loadData.
	load() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by EffectManager), for override by inheriting classes]
	// Invoked for all effects after all load() functions have been called,
	postload() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For override by inheriting classes]
	// Invoked by EffectManager when the "reload all" key combination is
	// pressed, or manually. Meant to have all commands reload any data they may
	// have - namely, if there are any command files loaded into commandManager,
	// they should be reloaded.
	reloadData() {
		// Do nothing by default (for overriding where needed)
	}
	
	// Creates a unique ID per Effect and per cmdname that is unique to that
	// Effect.
	_getCommandId(cmdname) {
		return `<${this.name}> ${cmdname}`;
	}
	
	// [For use by inheriting classes]
	// Registers the given command as a Twitch command.
	// Some properties of the cmd object:
	// 	cmdname			Name of the command. Using this with the command
	// 					character prefixed to it will invoke the command (e.g.
	// 					!hello for cmdname = "hello" and assuming the command
	// 					character is '!').
	// 	[aliases]		Additional names that can invoke the command.
	// 	[filters]		List of functions that affect whether or not the command
	// 					is invoked when used in the chat. These functions are
	// 					invoked one by one with a User object of the user who
	// 					sent the command to the chat, and if all of them return
	// 					true (or if there aren't any) then the command is
	// 					invoked.
	// 
	// See the registerCommand() function in TwitchManager for a description of
	// the rest. They are the same, with the addition of aliases here.
	registerCommand(cmd) {
		if (!cmd.aliases) {
			cmd.aliases = [];
		}
		
		if (!cmd.aliases.includes(cmd.cmdname)) {
			cmd.aliases.unshift(cmd.cmdname);
		}
		
		cmd.aliases.forEach(alias => {
			cmd.cmdname = alias;
			TwitchManager.registerCommand(
				this._getCommandId(alias),
				cmd);
		});
	}
	
	// [For use by inheriting classes]
	// Unregister a previously registered command. Only the identifying cmdname
	// is needed here.
	unregisterCommand(cmdname) {
		TwitchManager.unregisterCommand(this._getCommandId(cmdname));
	}
	
	// [For external use (by EffectManager)]
	// Attaches the given client (socket) to this Effect.
	// The source parameter specifies if this connection is direct ('direct'),
	// which means the client requested to attach to this Effect by name, or by
	// tag ('tag'), which means that the client requested to attach to all the
	// Effects that have a tage that this Effect has.
	attachClient(socket, source) {
		this._connectedClients[socket.id] = socket;
		socket.on('disconnect', () => {
			this._clientDisconnectedHandlers.forEach(handler => handler(socket));
			delete this._connectedClients[socket.id];
		});
		this._clientAttachedHandlers.forEach(handler => handler(socket));
		
		// This notifies the client that we have attached, so it can begin its
		// communications
		socket.emit('attached', source);
		
		this.log(`Client attached.`);
	}
	
	// [For external use (by EffectManager), for override by inheriting classes]
	// Should check if a given command (= { cmdname, args }) is a command
	// for this effect, and if so, invoke it and return true - otherwise
	// it should return false (like it does here by default)!
	// Derive in concrete deriving classes that have complex commands (if a
	// command is simple you can use registerCommand or forwardSimpleCommand
	// for it; this is for more complex things, such as commands with dynamic
	// names, e.g. self-commands).
	invokeCommand(user, command) {
		return false;
	}
	
	// [For use by inheriting classes]
	// Sends the given event with the given "arguments" object to all connected
	// clients.
	broadcastEvent(eventName, args) {
		Object.values(this._connectedClients).forEach(socket => {
			socket.emit(eventName, args);
		});
	}
	
	// [For use by inheriting classes]
	// Registers to be notified on a Twitch event.
	// When that event occurs, the given callback will be called.
	onTwitchEvent(eventName, callback) {
		TwitchManager.on(eventName, callback);
	}
	
	// [For use by inheriting classes]
	// Simple = up to one argument.
	// This is meant to facilitate a simple use-case where you want a command
	// to be invoked on the client rather than here on the server.
	// For example, if you write "this.forwardSimpleCommand('hello')" in an
	// inheriting Effect class, and have a client attach to this Effect, then
	// when a user enters "!hello" in the channel chat, the client will receive
	// a "hello" event from the server, along with whatever argument succeeded
	// it.
	forwardSimpleCommand(cmdname, filters) {
		this.registerCommand({
			cmdname: cmdname,
			filters: filters,
			callback: (user, arg) => {
				this.broadcastEvent(cmdname, arg);
			},
		});
	}
	
	// [For use by inheriting classes]
	// Simple = up to one argument.
	// Same as above, only for Twitch events.
	// For example, writing "this.forwardSimpleTwitchEvent('userJoined')" in the
	// inheriting Effect will make it so when a user joins the Twitch chat
	// channel, the attached client will receive a 'userJoined' event along with
	// its parameter(s).
	forwardSimpleTwitchEvent(eventName) {
		this.onTwitchEvent(eventName, arg => {
			// Add the name of the event to 
			this.broadcastEvent(eventName, arg);
		});
	}
	
	// [For use by inheriting classes]
	// Registers a function to be called when the given key combination is
	// pressed.
	// For a list of keys see Enums.KEYCODES in Enums.js.
	registerShortcutKey(name, shortcut, callback) {
		KeyboardManager.registerShortcut(
			`${this.name}_${name}`,
			shortcut,
			callback);
	}
	
	// [For use by inheriting classes]
	// Unregisters a previously registered shortcut key callback.
	unregisterShortcutKey(name) {
		KeyboardManager.unregisterShortcut(`${this.name}_${name}`);
	}
	
	// [For use by inheriting classes]
	// Sends the given message to the Twitch channel (the bot will say it).
	say(msg) {
		TwitchManager.say(msg);
	}
	
	// [For use by inheriting classes]
	// Same as above, only prefixed with "@username" directed at the user
	// specified.
	tell(user, msg) {
		TwitchManager.tell(user, msg);
	}
	
	// [For use by inheriting classes]
	// Marks a message so it's clear it relates to this Effect.
	// Useful when printing to the console.
	_printForm(message) {
		return `[${this.name}] ${message}`;
	}
	
	// [For use by inheriting classes]
	// Logs a message to the console, marked as coming from this Effect.
	log(message) {
		cli.log(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	// Logs a warning message to the console, marked as coming from this Effect.
	warn(message) {
		cli.warn(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	// Log an error message to the console, marked as coming from this Effect.
	error(message) {
		cli.error(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	deepPrint(obj, header) {
		if (header) {
			this.log(header);
		}
		
		cli.log(util.inspect(obj, false, null, true));
	}
	
	// [For use by inheriting classes]
	// Reads a file in a path relative to this Effect's working dir.
	// Syncrhonous function (waits for the file to be read).
	readFile(localFilePath) {
		return fs.readFileSync(path.join(this.workdir, localFilePath));
	}
	
	// [For use by inheriting classes]
	// Same as readFile, only it's also parsed as a JSON file and returned as
	// the object represented by it.
	readJSON(localJsonFilePath) {
		return JSON.parse(this.readFile(localJsonFilePath));
	}
	
	// [For use by inheriting classes]
	// Registers the given local directory under the given name for access by
	// clients via a URL.
	registerAssetDir(localPath, name) {
		let url = `/assets/effects/${this.name}/${name}`;
		Assets.registerDir(path.join(this.workdir, localPath), url);
		return url;
	}
	
	// [For use by inheriting classes]
	// Modifies the amount of StreamElements loyalty points the user has by the
	// given (positive or negative (or zero, honestly)) amount.
	modifyUserPoints(user, amount) {
		SEManager.addUserPoints(
			user.name,
			amount,
			null,
			(err) => this.error(`Failed to add points to ${user.name}: ${err}`));
	}
	
	// [For use by inheriting classes]
	// Makes the StreamElement bot say the given message.
	sendSEMessage(msg) {
		SEManager.say(msg);
	}
	
	// [For use by inheriting classes]
	// Registers the handler will be invoked when the given channel point reward
	// is redeemed (the name should be registered in the rewards file listed in
	// rewardsManager.js).
	// The function should accept the arguments (user, msg).
	// Only works for rewards that take a text from the user.
	onChannelReward(rewardName, handler) {
		RewardsManager.on(rewardName, handler);
	}
	
	// [For use by inheriting classes]
	// Return a string specifying the given amount of points along with the name
	// of the user points.
	// Also adjusts for singular when the quantity is 1 or -1.
	pointsString(points) {
		let name = 
			Math.abs(points) === 1 ?
			Effect.USERPOINTS_NAME_SINGULAR :
			Effect.USERPOINTS_NAME;
		return `${points} ${name}`;
	}
	
	// [For use by inheriting classes]
	// Utility access to the user Filters collection.
	static get Filters() {
		return User.Filters;
	}
	
	// [For use by inheriting classes]
	// Utility access to the keyboard keycodes for shortcut key registration.
	static get Keycodes() {
		return Enums.KEYCODES;
	}
	
	// [For use by inheriting classes]
	// Utility access to the AssetManageer.
	static get Assets() {
		return Assets;
	}
	
	// [For use by inheriting classes]
	// Utility access to the name of our loyalty points.
	static get USERPOINTS_NAME() {
		return SEManager.POINTS_NAME;
	}
	
	// [For use by inheriting classes]
	// Utility access to the name of our loyalty points in singular form (e.g.
	// "point" for 1 point instead of "points").
	static get USERPOINTS_NAME_SINGULAR() {
		return SEManager.POINTS_NAME_SINGULAR;
	}
}

module.exports = Effect;
