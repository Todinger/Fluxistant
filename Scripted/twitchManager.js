const assert = require('assert').strict;
const tmi = require('tmi.js');
const EventNotifier = require('./eventNotifier');
const User = require('./user').User;
const EffectManager = require('./effectManager');
const SEManager = require('./seManager');
const Log = require('./logger');

const COMMAND_PREFIX = '!';

class TwitchManager extends EventNotifier {
	constructor() {
		super();
		
		this._addEvents([
			// On the right are the arguments that handlers of
			// each event should accept
			// Their types and meaning are denoted by their names:
			// - user:		User object, which contains their data as well as a
			// 				full userstate object from which the data was taken
			// - message:	Text message (string)
			// - cmdname:	The name of a command (string, doesn't include the
			// 				command character)
			// - args:		Additional arguments, used in commands
			// - SEData:	The .data property of SE events (see SEManager)
			
			'message',				// (user, message)
			'command',				// (user, cmdname, args)
			'action',				// (user, message)
			'follow',				// (SEData)
			'cheer',				// 
			'tip',					// (SEData)
			'host',					// 
			'raid',					// 
			'channelReward',		// (user, reward, msg)
			'userJoined',			// (username)
			'userLeft',				// (username)
			'userFirstMessage',		// 
			'userReturnMessage',	// 
			'streamStart',			// 
			'streamEnd',			// 
			'userInactive',			// 
			'userActiveAgain',		// 
			'sub',					// 
			'resub',				// 
			'giftSub',				// 
			'kick',					// 
			'ban',					// 
		]);
		
		this._commandHandlers = {};		// Maps cmdname to collection of ID: callback
		this._commandHandlerIDs = {};	// Maps ID to cmdname name
		
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
	
	_forwardSEEvent(eventName) {
		SEManager.on(eventName, data => this._notify(eventName, data));
	}
	
	_registerAllEvents() {
		this.client.on('message', (channel, userstate, message, self) => {
			this._processMessage(userstate, message, self);
		});
		this.client.on('join', (channel, username, self) => {
			if (!self) this._notify('userJoined', username);
		});
		this.client.on('part', (channel, username, self) => {
			if (!self) this._notify('userLeft', username);
		});
		
		this._forwardSEEvent('tip');
		this._forwardSEEvent('follow');
	}
	
	say(msg) {
		this.client.say(this.channel, msg);
	}
	
	tell(user, msg) {
		this.say(`@${user.name} ${msg}`);
	}
	
	registerCommand(id, cmdname, filters, callback, cost, descriptionFunc) {
		assert(!(id in this._commandHandlerIDs),
			`Duplicate command registration for ID "${id}"`);
		
		// This is to make all commands case-insensitive
		cmdname = cmdname.toLowerCase();
		
		console.log(`Registering command '${COMMAND_PREFIX}${cmdname}' for '${id}'`);
		
		if (!(cmdname in this._commandHandlers)) {
			this._commandHandlers[cmdname] = {};
		}
		
		this._commandHandlerIDs[id] = cmdname;
		
		this._commandHandlers[cmdname][id] = {
			filters: filters || [],
			callback: callback,
			cost: cost,
			descriptionFunc: descriptionFunc,
		};
	}
	
	unregisterCommand(id) {
		assert(id in this._commandHandlerIDs, `Unknown handler ID: ${id}`);
		
		delete this._commandHandlers[this._commandHandlerIDs[id]];
		delete this._commandHandlerIDs[id];
	}
	
	
	_parseCommand(msg) {
		if (!msg.startsWith(COMMAND_PREFIX)) {
			return null;
		}
		
		// Ditch the command prefix
		msg = msg.substring(COMMAND_PREFIX.length).trim();
		
		// Remove multiple consecutive spaces
		msg = msg.replace(/\s{2,}/g, ' ');
		
		// A command is composed of its name followed by arguments, all
		// delimited by spaces
		let parts = msg.split(' ');
		let cmdname = parts[0].toLowerCase();
		let args = parts.slice(1);
		
		return {
			cmdname: cmdname,
			args: args,
			fullname: `${COMMAND_PREFIX}${cmdname}`,
		};
	}
	
	_invokeCommand(user, command) {
		if (command === null) {
			return false;
		}
		
		let isCommand = false;
		
		// Check if any handlers have been registered for this command
		// and invoke them if so
		if (command.cmdname in this._commandHandlers) {
			isCommand = true;
			
			let fullargs = [user].concat(command.args);
			
			// Invoke the specific command handlers
			Object.values(this._commandHandlers[command.cmdname]).forEach(handler => {
				if (handler.filters.reduce(
					(soFar, currentFilter) => soFar && currentFilter(user), true)) {
						if (handler.cost && handler.cost > 0) {
							let response = handler.descriptionFunc
								? handler.descriptionFunc(user, command.cmdname)
								: `${user.name} has invoked ${command.fullname} for ${handler.cost} ${SEManager.POINTS_NAME}!`;
							SEManager.consumeUserPoints(
								user.name,
								handler.cost,
								(oldAmount, newAmount) => {
									Log.info(`${user.name} invoked ${command.cmdname} for ${handler.cost} - had ${oldAmount}, now has ${newAmount}.`);
									this.say(response);
									handler.callback.apply(null, fullargs);
								},
								(amount, points) => {
									this.tell(user, `You do not have enough ${SEManager.POINTS_NAME} to use the ${command.fullname} command. (${points} / ${amount})`);
								},
								error => {
									console.error(`Failed to consume user points: ${error}`);
								});
						} else {
							handler.callback.apply(null, fullargs);
						}
				}
			});
		}
		
		// Let every effect examine the command and invoke it if it's one of
		// its commands - if any of them did, then this is a command
		Object.values(EffectManager.effects).forEach(effect => {
			isCommand = isCommand || effect.invokeCommand(user, command);
		});
		
		if (isCommand) {
			// Invoke the general command handlers
			this._notify('command', user, command.cmdname, command.args);
		}
		
		return isCommand;
	}
	
	_processMessage(userstate, message, self) {
		// TODO: Uncomment error catching
		try {
			if(self) return;
			// console.log('Message!');
			// console.log(message);
			// console.log(userstate);
			
			let user = new User(userstate);
			
			if (userstate['custom-reward-id']) {
				// This is a reward redemption with a custom message
				// 
			}
			
			switch(userstate['message-type']) {
				case 'action':
					this._notify('action', user, message);
					break;
				default:
					console.warn("Unknown message type received, treating as regular message.");
				case 'whisper':
				case 'chat':
					// Check if this is a command and invoke it if so - only
					// proceed to treat this as a regular message if it's not
					// a command
					let command = this._parseCommand(message);
					if (this._invokeCommand(user, command)) {
						return;
					}
					
					this._notify('message', user, message);
					
					break;
			}
			
			// if(message.toLowerCase() === '!hello') {
			// 	client.say(channel, `@${tags.username}, heya!`);
			// }
		}
		catch (err) {
			console.error(err);
		}
	}
}

module.exports = new TwitchManager();
