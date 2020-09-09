var assert = require('assert').strict;
var tmi = require('tmi.js');
var User = require('./user').User;

const COMMAND_PREFIX = '!';

class TwitchManager {
	constructor() {
		this._eventHandlers = {
			// On the right are the arguments that handlers of
			// each event should accept
			// Their types and meaning are denoted by their names:
			// - user:		User object, which contains their data as well as a
			// 				full userstate object from which the data was taken
			// - message:	Text message (string)
			// - cmdname:	The name of a command (string, doesn't include the
			// 				command character)
			// - args:		Additional arguments, used in commands
			
			message: [],			// (user, message)
			command: [],			// (user, cmdname, args)
			action: [],				// (user, message)
			follow: [],				// 
			cheer: [],				// 
			tip: [],				// 
			host: [],				// 
			raid: [],				// 
			channelReward: [],		// 
			userJoined: [],			// (username)
			userLeft: [],			// (username)
			userFirstMessage: [],	// 
			userReturnMessage: [],	// 
			streamStart: [],		// 
			streamEnd: [],			// 
			userInactive: [],		// 
			userActiveAgain: [],	// 
			sub: [],				// 
			resub: [],				// 
			giftSub: [],			// 
			kick: [],				// 
			ban: [],				// 
		}
		
		this._commandHandlers = {};
		
		this.client = null;
	}
	
	init(channel, botname, oauth) {
		this.channel = channel;
		
		this.client = new tmi.Client({
			// TODO: Change debug to false
			options: { debug: true },
			connection: {
				reconnect: true,
				secure: true,
			},
			identity: {
				username: botname,
				password: oauth,
			},
			channels: [ channel ],
		});
		
		this.client.connect().catch(console.error);
		
		this._registerAllEvents();
	}
	
	_registerAllEvents() {
		let _this = this;
		
		this.client.on('message', (channel, userstate, message, self) => {
			this._processMessage(userstate, message, self);
		});
		this.client.on('join', (channel, username, self) => {
			this._invokeEvent('userJoined', username);
		});
		this.client.on('part', (channel, username, self) => {
			this._invokeEvent('userLeft', username);
		});
	}
	
	say(msg) {
		this.client.say(this.channel, msg);
	}
	
	on(eventName, callback) {
		assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		this._eventHandlers[eventName].push(callback);
		return this;
	}
	
	onCommand(cmdname, filters, callback) {
		if (!(cmdname in this._commandHandlers)) {
			this._commandHandlers[cmdname] = [];
		}
		
		this._commandHandlers[cmdname].push({
			filters: filters,
			callback: callback,
		});
	}
	
	
	
	_isKnownCommand(msg) {
		return msg.startsWith(COMMAND_PREFIX);
	}
	
	_invokeCommand(user, msg, userstate) {
		// Ditch the command prefix
		msg = msg.substring(COMMAND_PREFIX.length);
		
		// A command is composed of its name followed by arguments, all
		// delimited by spaces
		let parts = msg.split(' ');
		let cmdname = parts[0];
		let args = parts.slice(1);
		let fullargs = [user].concat(args);
		
		// Invoke the specific command handlers
		this._commandHandlers[cmdname].forEach(handler => {
			if (handler.filters.reduce(
				(soFar, currentFilter) => soFar && currentFilter(user), true)) {
					handler.callback.apply(null, fullargs);
			}
		});
		
		// Invoke the general command handlers
		this._invokeEvent('command', user, cmdname, args);
	}
	
	_processMessage(userstate, message, self) {
		// TODO: Uncomment error catching
		// try {
			if(self) return;
			
			let user = new User(userstate);
			
			switch(userstate["message-type"]) {
				case "action":
					this._invokeEvent('action', user, message);
					break;
				default:
					console.warn("Unknown message type received, treating as regular message.");
				case "whisper":
				case "chat":
					if (this._isKnownCommand(message)) {
						this._invokeCommand(user, message);
					}
					
					this._invokeEvent('message', user, message);
					
					break;
			}
			
			// if(message.toLowerCase() === '!hello') {
			// 	client.say(channel, `@${tags.username}, heya!`);
			// }
		// }
		// catch (err) {
		// 	console.error(err);
		// }
	}
	
	_invokeEvent(eventName, ...args) {
		assert(eventName in this._eventHandlers, `Unknown event: ${eventName}`);
		this._eventHandlers[eventName].forEach(callback => callback.apply(null, args));
	}
}

module.exports = new TwitchManager();
