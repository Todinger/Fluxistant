'use strict';

const assert = require('assert').strict;
const fs = require('fs');
const path = require('path');
const util = require('util');
// const cli = require('./cliManager');
const User = require('./user');
const TwitchManager = require('./twitchManager');
const Enums = require('./enums');
const KeyboardManager = require('./keyboardManager');
const Assets = require('./assets');
const CommandManager = require('./commandManager');
const SEManager = require('./seManager');
const RewardsManager = require('./rewardsManager');
const Logger = require('./logger');
const ModuleConfig = require('./Config/moduleConfig');
const Command = require('./command');
const MainConfig = require('./mainConfig');

// This is the base class for all server-side Module-specific logic classes.
// 
// To create a new Module, create a subdirectory within ./Modules/ from where
// this file is, add a "module.js" file in it, require this file and inherit
// this class.
class Module {
	// Pass an object in the super() call in the concrete Module's constructor
	// to configure the module.
	// The properties of the description object are as follows:
	// 	name		Unique name, can have spaces and such.
	// 	[enabled]	If set specifically to false, prevents the script from
	// 				being loaded at all (as if the file wasn't there).
	// 	[webname]	Web identifier. Should be URL-friendly.
	// 	[websounds]	Means this module's web client has sounds. This means that
	// 				the volume command will be automatically added.
	// 	[zindex]	Used by the module aggregator page, ScriptedModule, this
	// 				specifies th z-index of the Module's frame on the page.
	// 				Use this to put things in front of or behind other things.
	// 	[tags]		This specifies you wish to attach to any client that
	// 				requests to connect to a server Module by one of the tags
	// 				listed here. It is used for one-to-many connections between
	// 				display pages and scripts (e.g. multiple Modules wanting to
	// 				show images can attach to the 'imgdisp' tag that the
	// 				ImageDisplay Module client attaches to).
	// 	[debug]		If set, using this.say() and this.tell() prints to the
	// 				console instead of sending to the Twitch channel chat.
	// 	
	// (Anything in [brackets] is optional.)
	// If the concrete Module has a source, it also needs a webname, and when
	// the server is running, the URL of the Module's HTML file will be
	// "/mod/webname/source" (e.g. http://localhost:3333/mod/hellow/world.html for
	// webname = "hello" and source = "world.html").
	constructor(description) {
		// if (description.enabled === false) {
		// 	this.enabled = false;
		// 	return;
		// } else {
		// 	this.enabled = true;
		// }
		
		this.name = description.name;
		this.webname = description.webname;
		this.source = description.source;
		this.zindex = description.zindex;
		this.tags = description.tags;
		this.webSounds = description.webSounds;
		
		// Utility objects
		this.moduleManager = null;
		this.commandManager = new CommandManager(this);
		
		// Do not set these two; they are set by ModuleManager
		// after the module has finished construction and validation
		// (before the load() function is invoked)
		this.moduleManager = null;
		this.workdir = null;
		
		// Client management
		this._clientAttachedHandlers = [];
		this._clientDisconnectedHandlers = [];
		this._connectedClients = {};
		
		// Data
		this.data = null; // Filled during defineData
		
		// Configuration
		this.config = {};
		this.modConfig = new ModuleConfig(this.name);
		
		// This is just to get the IDE to stop whining about this.shortcuts not being
		// defined (that's kind of the point here...)
		if (!this.shortcuts) {
			this.shortcuts = undefined;
		}
		
		// Loads the module in debug mode, replacing chat messages with
		// console log printouts
		if (description.debug) {
			this.say = this.log;
			this.tell = (user, msg) => {
				this.say(`@${user.displayName} ${msg}`);
			}
		}
		
		// This is set to true once the configuration has been loaded for
		// the first time - it's used to invoke the enabled() function
		// on startup, in case we don't switch from enabled=false to
		// enabled=true then
		this.active = false;
	}
	
	get enabled() {
		return this.config.enabled;
	}
	
	filterDesc(type, arg) {
		return {
			type: type,
			argument: arg,
		}
	}
	
	_addCommonCommands() {
		if (!this.commands) {
			this.commands = {};
		}
		
		// The !fxvol command is only relevant to modules that have a web client part with audio
		if (this.webname && this.webSounds) {
			this.commands['fxvol'] = {
				name: 'Set Volume',
				description: 'Modifies the volume level of sounds produced by this module. Accepts a percentage number (0-100) for setting a specific volume, or differences with +/- (e.g. +20 would increase the volume by 20%, up to 100%).',
				filters: [this.filterDesc('isOneOf', ['fluxistence', 'yecatsmailbox'])],
				callback: (user, volume) => {
					this.broadcastEvent('fxvol', {username: user.name, volume});
				}
			}
		}
	}
	
	registerCommands(commandObjects) {
		commandObjects = commandObjects || this.commandObjects;
		if (commandObjects) {
			Object.values(commandObjects).forEach(co => this.registerCommand(co));
		}
	}
	
	unregisterCommands(commandObjects) {
		commandObjects = commandObjects || this.commandObjects;
		if (commandObjects) {
			Object.values(commandObjects).forEach(cmd => {
				this.unregisterCommand(cmd.cmdname, cmd.cmdid);
				cmd.aliases.forEach(alias => this.unregisterCommand(alias, cmd.cmdid));
			});
		}
	}
	
	createCommandObject(command) {
		return new Command(this, command);
	}
	
	createCommandObjects(commands) {
		if (commands) {
			let cmdObjects = {};
			Object.keys(commands).forEach(cmdid => {
				cmdObjects[cmdid] = this.createCommandObject(commands[cmdid]);
			});
			return cmdObjects;
		}
	}
	
	getCommandName(cmdid) {
		return this.commandObjects && this.commandObjects[cmdid].cmdname || null;
	}
	
	importCommandInfo(commandList, commandObjects) {
		commandObjects = commandObjects || this.commandObjects;
		if (commandObjects && commandList) {
			commandList.forEach(commandData => {
				if (commandData.cmdid in commandObjects) {
					commandObjects[commandData.cmdid].import(commandData);
				}
			});
		}
	}
	
	registerShortcuts(shortcuts) {
		shortcuts = shortcuts || this.shortcuts;
		if (shortcuts) {
			Object.keys(shortcuts).forEach(shortcutID => {
				if (shortcuts[shortcutID].keys) {
					for (let i = 0; i < shortcuts[shortcutID].keys.length; i++) {
						let keys = shortcuts[shortcutID].keys[i];
						let name = `${shortcutID}[${i}]`;
						let shortcutKeycodes = keys.map(
							key => {
								assert(
									key !== 'CHAR_UNDEFINED',
									'Undefined key given for shortcut.');
								
								let keyCode = 'VC_' + key.toUpperCase();
								assert(
									keyCode in Module.Keycodes,
									`Unknown key: ${key}`);
								
								return Module.Keycodes[keyCode];
							});
						
						this.registerShortcutKey(
							name,
							shortcutKeycodes,
							shortcuts[shortcutID].callback
						);
					}
				}
			});
		}
	}
	
	unregisterShortcuts(shortcuts) {
		shortcuts = shortcuts || this.shortcuts;
		if (shortcuts) {
			Object.keys(shortcuts).forEach(shortcutID => {
				if (shortcuts[shortcutID].keys) {
					for (let i = 0; i < shortcuts[shortcutID].keys.length; i++) {
						let name = `${shortcutID}[${i}]`;
						this.unregisterShortcutKey(name);
					}
				}
			});
		}
	}
	
	importShortcutInfo(newShortcutInfo, shortcuts) {
		shortcuts = shortcuts || this.shortcuts;
		if (shortcuts && newShortcutInfo) {
			Object.keys(newShortcutInfo).forEach(shortcut => {
				if (shortcut in shortcuts) {
					shortcuts[shortcut].keys = newShortcutInfo[shortcut];
				}
			});
		}
	}
	
	// [For use by inheriting classes]
	// Invokes the given handler when a client is attached to this Module.
	// The handler should accept a (socket) argument with the attached client.
	onClientAttached(handler) {
		this._clientAttachedHandlers.push(handler);
	}
	
	// [For use by inheriting classes]
	// Invokes the given handler when a client is detached from this Module.
	// The handler should accept a (socket) argument with the detached client.
	onClientDisconnected(handler) {
		this._clientDisconnectedHandlers.push(handler);
	}
	
	// [For external use (by ModuleManager), NOT for override by inheriting classes!]
	// Invoked during initialization (before defineConfig).
	// Lets the concrete module define the data files it's going to use and saves
	// a reference to the module's data manager.
	defineData(modData) {
		this.data = modData;
		this.defineModData(modData);
	}
	
	// [For override by inheriting classes]
	// This is where the concrete module defines its data.
	// This can mean multiple collections or just a single file.
	// In order for data files and collections to be configurable, they need to
	// be added to the configuration as well in defineModConfig.
	defineModData(modData) {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by ModuleManager), NOT for override by inheriting classes!]
	// Invoked during initialization (before loadConfig).
	// Lets the concrete module define its configuration and then adds some common
	// things that all modules need.
	defineConfig(modConfig) {
		this._addCommonCommands();
		this.defineModConfig(modConfig); // Common commands may be overridden here - that's fine
		
		if (this.commands) {
			Object.keys(this.commands).forEach(
				cmdid => this.commands[cmdid].cmdname = cmdid);
			this.commandObjects = this.createCommandObjects(this.commands);
			this.registerCommands();
			modConfig.addCommands(this.commands);
		}
		
		if (this.shortcuts) {
			this.registerShortcuts();
			modConfig.addShortcuts(this.shortcuts);
		}
		
		this.config = modConfig.toConf();
	}
	
	// [For override by inheriting classes]
	// This is where the module describes its own configuration scheme.
	// If the module requires anything beyond the basic "enabled/disabled"
	// setting (which is automatically added, so don't add it in the modules),
	// add them to the modConfig object passed here.
	defineModConfig(modConfig) {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by ModuleManager)]
	// Invoked before preload and whenever the module is requested to reload its
	// configuration.
	// This performs some common tasks related to loading module configurations
	// and lets the concrete inheriting module do the rest.
	loadConfig(conf) {
		// Handle command re-registrations
		if (this.config.enabled && !conf.enabled) {
			// Module deactivation
			this.unregisterCommands();
			this.unregisterShortcuts();
		} else if (!this.config.enabled && conf.enabled) {
			// Commands not updated, but module activated
			this.registerCommands();
			this.registerShortcuts();
		} else if (conf.enabled && conf.commands && this.commandObjects) {
			// Module is active, import the updated commands and shortcuts
			//  and re-register all of them
			this.unregisterCommands();
			this.importCommandInfo(conf.commands);
			
			this.unregisterShortcuts();
			this.importShortcutInfo(conf.shortcuts);
			
			if (conf.enabled) {
				// Commands and shortcuts updated and module activated or remains active
				this.registerCommands();
				this.registerShortcuts();
			}
		}
		
		// Invoke the enable/disable convenience functions
		if (this.config.enabled && !conf.enabled) {
			// Module deactivation
			this.disable();
		} else if ((!this.config.enabled || !this.active) && conf.enabled) {
			// Module activation - happens when switching 'enabled' value
			// for the module from false to true, and when the configuration
			// is loaded for the first time, if the module is enabled then
			this.enable();
		}
		
		// Save the new configuration
		this.config = conf;
		
		// Update the module itself about the configuration changes
		this.loadModConfig(conf);
		
		// The first configuration loading is done (and possibly more)
		this.active = true;
	}
	
	// [For override by inheriting classes]
	// This is called when the configuration changes and its .enabled
	// value went from true to false.
	// This is called in addition to loadModConfig(), so you can either
	// use this or check the .enabled flag in the loaded configuration.
	// This is here for convenience, so that mods than only care about
	// enabling/disabling can use this instead of loadConfig().
	disable() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For override by inheriting classes]
	// This is called when the configuration changes and its .enabled
	// value went from false to true.
	// This is called in addition to loadModConfig(), so you can either
	// use this or check the .enabled flag in the loaded configuration.
	// This is here for convenience, so that mods than only care about
	// enabling/disabling can use this instead of loadConfig().
	enable() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For override by inheriting classes]
	// Inheriting classes should implement this if they implemented the
	// defineModConfig() function. Here you get a filled-out configuration object
	// with real values. This happens at startup and whenever the user changes
	// the configuration during runtime, so you need to "undo" the current
	// configuration and configure the module again based on the values in the
	// given config object here.
	// The config object doesn't contain ConfigEntities, but rather the plain
	// values that it describes.
	//
	// This is the first entry point the module has (the first code of the
	// module that gets executed), and is meant for initialization normally, but
	// there may be times when the configuration files are reloaded, in which
	// case the module needs to know how to deal with this function being
	// invoked during actual runtime.
	// One specific case that should be noted is the config.enabled value, which
	// can turn the module on and off at any time. When it gets turned off,
	// it should no longer do anything at all (so cancel timers and such).
	//
	// NOTE: ONLY SAVE VALID CONFIGURATIONS!
	// If a Module encounters an error while loading the configuration, it
	// should throw an error and KEEP THE OLD CONFIGURATION.
	// This is so that when we reload configurations  during runtime we can
	// alert the user about faulty values and still keep running smoothly
	// without crashing.
	loadModConfig(conf) {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by ModuleManager), for override by inheriting classes]
	// Invoked after creation and assignment of basic values by ModuleManager.
	preload() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by ModuleManager), for override by inheriting classes]
	// Invoked after preload and whenever the module is requested to reload its
	// data (only applicable to some modules, usually those that read files and
	// such).
	// If there are any command files loaded into commandManager, they should
	// be reloaded.
	// 
	// NOTE: ONLY SAVE VALID DATA!
	// If a Module encounters an error while loading data, it should throw an
	// error and KEEP THE OLD DATA (if it has any).
	// This is so that when we reload data during runtime we can alert the user
	// about faulty data and still keep running smoothly without crashing.
	loadData() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by ModuleManager), for override by inheriting classes]
	// Invoked after loadData.
	load() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For external use (by ModuleManager), for override by inheriting classes]
	// Invoked for all modules after all load() functions have been called,
	postload() {
		// Do nothing by default (for overriding where needed)
	}
	
	// [For override by inheriting classes]
	// Invoked by ModuleManager when the "reload all" key combination is
	// pressed, or manually. Meant to have all commands reload any data they may
	// have - namely, if there are any command files loaded into commandManager,
	// they should be reloaded.
	reloadData() {
		// Do nothing by default (for overriding where needed)
	}
	
	// Creates a unique ID per Module and per cmdname that is unique to that
	// Module.
	_getCommandId(cmdname, cmdid) {
		let prefix = '';
		if (cmdid) {
			prefix = `${cmdid}: `;
		}
		
		return `<${this.name}> ${prefix}${cmdname}`;
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
		
		let allNames = [cmd.cmdname].concat(cmd.aliases).filter((alias) => alias && alias.length > 0);
		let cmdname = cmd.cmdname;
		
		allNames.forEach(alias => {
			cmd.cmdname = alias;
			TwitchManager.registerCommand(
				this._getCommandId(alias, cmd.cmdid),
				cmd);
		});
		
		cmd.cmdname = cmdname;
	}
	
	// [For use by inheriting classes]
	// Unregister a previously registered command. Only the identifying cmdname
	// is needed here.
	unregisterCommand(cmdname, cmdid) {
		TwitchManager.unregisterCommand(this._getCommandId(cmdname, cmdid));
	}
	
	// [For external use (by ModuleManager)]
	// Attaches the given client (socket) to this Module.
	// The source parameter specifies if this connection is direct ('direct'),
	// which means the client requested to attach to this Module by name, or by
	// tag ('tag'), which means that the client requested to attach to all the
	// Modules that have a tage that this Module has.
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
	
	// [For external use (by ModuleManager), for override by inheriting classes]
	// Should check if a given command (= { cmdname, args }) is a command
	// for this module, and if so, invoke it and return true - otherwise
	// it should return false (like it does here by default)!
	// Derive in concrete deriving classes that have complex commands (if a
	// command is simple you can use registerCommand or forwardSimpleCommand
	// for it; this is for more complex things, such as commands with dynamic
	// names, e.g. self-commands).
	// noinspection JSUnusedLocalSymbols
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
	// inheriting Module class, and have a client attach to this Module, then
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
	// inheriting Module will make it so when a user joins the Twitch chat
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
	// Registers a callback that will be invoked every time a key is held down
	// (possibly repeating while the key is down, I'm not sure)
	onKeyDown(handler) {
		KeyboardManager.onKeyDown(handler);
	}
	
	// [For use by inheriting classes]
	// Removes a previously registered key-down handler
	removeKeyDownHandler(handler) {
		KeyboardManager.removeKeyDownHandler(handler);
	}
	
	// [For use by inheriting classes]
	// Registers a callback that will be invoked every time a key is released
	onKeyUp(handler) {
		KeyboardManager.onKeyUp(handler);
	}
	
	// [For use by inheriting classes]
	// Removes a previously registered key-up handler
	removeKeyUpHandler(handler) {
		KeyboardManager.removeKeyUpHandler(handler);
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
	// Same as above, only addressed to the streamer using the name they
	// configured in the main configuration.
	tellStreamer(msg) {
		TwitchManager.say(`@${MainConfig.getStreamerName()} ${msg}`);
	}
	
	// [For use by inheriting classes]
	// Marks a message so it's clear it relates to this Module.
	// Useful when printing to the console.
	_printForm(message) {
		return `[${this.name}] ${message}`;
	}
	
	// [For use by inheriting classes]
	// Logs a message to the log, marked as coming from this Module.
	log(message) {
		Logger.info(this._printForm(message));
		// cli.log(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	// Logs a warning message to the log, marked as coming from this Module.
	warn(message) {
		Logger.warn(this._printForm(message));
		// cli.warn(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	// Log an error message to the log, marked as coming from this Module.
	error(message) {
		Logger.error(this._printForm(message));
		// cli.error(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	// Log a debug message to the log, marked as coming from this Module.
	debug(message) {
		Logger.debug(this._printForm(message));
	}
	
	// [For use by inheriting classes]
	deepPrint(obj, header) {
		if (header) {
			this.log(header);
		}
		
		Logger.debug(util.inspect(obj, false, null, true));
		// cli.log(util.inspect(obj, false, null, true));
	}
	
	// [For use by inheriting classes]
	// Reads a file in a path relative to this Module's working dir.
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
		let url = `/assets/modules/${this.name}/${name}`;
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
		return SEManager.pointsString(points);
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
	// Utility access to the AssetManager.
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

module.exports = Module;
