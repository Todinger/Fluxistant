const assert = require('assert').strict;
const tmi = require('tmi.js');
const _ = require('lodash');
const EventNotifier = require('./eventNotifier');
const User = require('./user').User;
const EffectManager = require('./effectManager');
const SEManager = require('./seManager');
const DBLog = require('./Logger');
const Utils = require('./utils');

const COMMAND_PREFIX = '!';
const COOLDOWN_CLEANUP_INTERVAL = 5 * 60 * 1000;	// 5 minutes

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
		this._cooldownData = {};
		
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
		
		setInterval(() => this._cleanupCooldowns(), COOLDOWN_CLEANUP_INTERVAL);
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
		this.say(`@${user.displayName} ${msg}`);
	}
	
	// cmd structure:
	// 		id			Unique identifier for this command registration
	// 					Note: The same cmdname can be registered for multiple
	// 					commands (so each effect can make e.g. '!start' do its
	// 					own thing if desired), but this should be unique across
	// 					ALL registrations - therefore it is recommended to use
	// 					the effect's inherited registerCommand() function rather
	// 					than this one, as it adds the name of the effect to the
	// 					ID, preventing collision between different effects
	// 					Another note: Putting this in the cmd object itself is
	// 					optional (it will be added if it's not present)
	// 		cmdname		Name used to invoke the command (e.g. 'bla' for '!bla')
	// 		callback	Function to call upon command invocation
	// 		filters		User filters to run before executing (only if all the
	// 					filters return true will the command be executed)
	// 		cost		Price (StreamElements loyalty points) to invoke the
	// 					command - it will only be executed if the user has
	// 					enough points for it, and those points will be deducted
	// 					if so (naturally this only applies if this value is set,
	// 					and only if it's a positive number)
	// 		descFunc	A function to invoke that should return a string for the
	// 					bot to send to the channel upon command invocation (only
	// 					applies to commands with an actual cost)
	// 		cooldowns {	Various cooldown values, in milliseconds
	// 			user	The same user can only use the command once in this time
	// 			global	The command can only be invoked once in this time
	// 		}
	registerCommand(id, cmd) {
		assert(!(id in this._commandHandlerIDs),
			`Duplicate command registration for ID "${id}"`);
		
		// Add the ID to the command object if it hasn't been added already
		if (!(id in cmd)) {
			cmd.id = id;
		}
		
		// This is to make all commands case-insensitive
		cmd.cmdname = cmd.cmdname.toLowerCase();
		
		// Default value if omitted
		cmd.filters = cmd.filters || [];
		
		console.log(`Registering command '${COMMAND_PREFIX}${cmd.cmdname}' for '${id}'`);
		
		if (!(cmd.cmdname in this._commandHandlers)) {
			this._commandHandlers[cmd.cmdname] = {};
		}
		
		this._commandHandlerIDs[id] = cmd.cmdname;
		
		this._commandHandlers[cmd.cmdname][id] = cmd;
		// this._commandHandlers[cmd.cmdname][id] = {
		// 	filters: cmd.filters || [],
		// 	callback: cmd.callback,
		// 	cost: cmd.cost,
		// 	descriptionFunc: cmd.descriptionFunc,
		// 	cooldown: cmd.cooldown,
		// };
	}
	
	unregisterCommand(id) {
		assert(id in this._commandHandlerIDs, `Unknown handler ID: ${id}`);
		
		delete this._commandHandlers[this._commandHandlerIDs[id]];
		delete this._commandHandlerIDs[id];
		delete this._cooldownData[id];
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
	
	_handleCommand(user, command, handler) {
		let fullargs = [user].concat(command.args);
		
		if (handler.cost && handler.cost > 0) {
			let response = handler.descFunc
				? handler.descFunc(user, command.cmdname)
				: `${user.name} has invoked ${command.fullname} for ${handler.cost} ${SEManager.POINTS_NAME}!`;
			SEManager.consumeUserPoints(
				user.name,
				handler.cost,
				(oldAmount, newAmount) => {
					DBLog.info(`${user.name} invoked ${command.cmdname} for ${handler.cost} - had ${oldAmount}, now has ${newAmount}.`);
					this.say(response);
					handler.callback.apply(null, fullargs);
					this._applyCooldowns(user, handler);
				},
				(amount, points) => {
					this.tell(user, `You do not have enough ${SEManager.POINTS_NAME} to use the ${command.fullname} command. (${points} / ${amount})`);
				},
				error => {
					console.error(`Failed to consume user points: ${error}`);
				});
		} else {
			handler.callback.apply(null, fullargs);
			this._applyCooldowns(user, handler);
		}
	}
	
	// Returns true iff the user is currently allowed to use theh command
	_checkCooldowns(user, handler) {
		if (handler.cooldowns) {
			let cdd = this._cooldownData[handler.id];
			
			// If cdd is undefined then there's no cooldown data yet,
			// so it hasn't been used and thus it's not on cooldown
			if (cdd) {
				if (cdd.global && (Utils.now() < cdd.global)) {
					// This command is still on a global cooldown right now
					return false;
				}
				
				if (cdd.users &&
					cdd.users[user.name] &&
					Utils.now() < cdd.users[user.name]) {
						// This user is still on cooldown for this command
						return false;
				}
			}
		}
		
		return true;
	}
	
	// Applies cooldowns for the command (should only be used after the command
	// has successfully been invoked)
	_applyCooldowns(user, handler) {
		if (handler.cooldowns) {
			let cooldownData = this._cooldownData[handler.id] || {};
			
			if (handler.cooldowns.user) {
				if (!cooldownData.users) {
					cooldownData.users = {};
				}
				
				cooldownData.users[user.name] =
					Utils.now() + handler.cooldowns.user;
			}
			
			if (handler.cooldowns.global) {
				cooldownData.global = Utils.now() + handler.cooldowns.global;
			}
			
			this._cooldownData[handler.id] = cooldownData;
		}
	}
	
	// Removes expired cooldowns periodically
	_cleanupCooldowns() {
		let now = Utils.now();
		
		Object.keys(this._cooldownData).forEach(id => {
			let cdd = this._cooldownData[id];
			
			if (cdd.users) {
				Object.keys(cdd.users).forEach(username => {
					if (cdd.users[username] < now) {
						console.log(`>> Deleting user cooldown for ${username}`);
						delete cdd.users[username];
					}
				});
				
				if (_.isEmpty(cdd.users)) {
					console.log(`>> Deleting empty cooldown data: users`);
					delete cdd.users;
				}
			}
			
			if (cdd.global) {
				if (cdd.global < now) {
					console.log(`>> Deleting empty cooldown data: global`);
					delete cdd.global;
				}
			}
			
			if (_.isEmpty(cdd)) {
				console.log(`>> Deleting empty cooldown data`);
				delete this._cooldownData[id];
			}
		});
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
			
			// Invoke the specific command handlers
			Object.values(this._commandHandlers[command.cmdname]).forEach(
				handler => {
					if (handler.filters.reduce(
						(soFar, currentFilter) => soFar && currentFilter(user),
						true)) {
							if (this._checkCooldowns(user, handler)) {
								this._handleCommand(user, command, handler);
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
