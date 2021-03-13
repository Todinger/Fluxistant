const assert = require('assert').strict;
const tmi = require('tmi.js');
const _ = require('lodash');
const EventNotifier = require('./eventNotifier');
const cli = require('./cliManager');
const { User, UserFilters } = require('./user');
const ModuleManager = require('./moduleManager');
const SEManager = require('./seManager');
// const DBLog = require('./Logger');
const Utils = require('./utils');

// All commands written by users need to start with this prefix, but when
// registering commands in the system you should NOT include it
const COMMAND_PREFIX = '!';

// Cooldown data is added for commands that have cooldowns; we have a function
// running every set interval (determined by this constant) which deletes old
// data to clear the clutter
const COOLDOWN_CLEANUP_INTERVAL = 5 * 60 * 1000;	// 5 minutes

// This class is responsible for the vast majority of integrations with Twitch.
// It does not include PubSub, and managing channel reward redemptions is done
// in RewardsManager instead - but even that is just a wrapper for the reward
// redemptions that are recognized in this class.
// Also features a little bit from StreamElements.
// 
// If there's something you want to do with Twitch, this is the place to look.
// There are a lot of events that I've not yet implemented, but they mostly just
// require forwarding from tmi.js.
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
			'channelReward',		// (user, rewardID, msg)
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
		this._cooldownData = {};		// Information we need to support cooldowns
		
		// The tmi.js client we use to implement the Twitch events and actions
		this.client = null;
		
		// Set this to true if you want to see the custom reward IDs of all the
		// rewards that have text messages that are redeemed in the channel
		this.printRewardIDs = false;
		
		// Connection information - we use this to know where we're connected to
		// when a new connection request comes in, so we know whether we need to
		// reconnect or not
		this.channelParams = null;
	}
	
	// Performs general initialization
	init() {
		// Start a recurring cleanup process to get rid of old cooldown data
		setInterval(() => this._cleanupCooldowns(), COOLDOWN_CLEANUP_INTERVAL);
		
		this._registerToCliEvents();
		this._registerToSEEvents();
	}
	
	// Gets the name of the channel we're connected to
	get channel() {
		return this.params.channel;
	}
	
	_validParams(params) {
		return params && params.channel && params.botname && params.oAuth;
	}
	
	_paramsAreTheSame(params) {
		return this.params.channel.toLowerCase() === params.channel.toLowerCase() &&
			this.params.botname.toLowerCase() === params.botname.toLowerCase() &&
			this.params.oAuth === params.oAuth;
	}
	
	// Starts... everything.
	// Connects to Twitch through tmi.js and starts listening for events.
	// If it's already connected, this will disconnect from the current
	// server and connect to the new one given.
	//
	// Parameters in params:
	// 	channel		The name of the channel you want to work with.
	// 	botname		The name of this bot on your channel.
	// 	oAuth		OAuth token for the bot account
	connect(params) {
		if (!this._validParams(params)) {
			this.disconnect();
			return;
		} else if (this.params && this._paramsAreTheSame(params)) {
			// If we're already connected to the requested channel, do nothing
			return;
		}
		
		// Disconnect if necessary
		if (this.client) {
			this.client.disconnect();
		}
		
		this.params = {
			channel: params.channel.toLowerCase(),
			botname: params.botname.toLowerCase(),
			oAuth: params.oAuth,
		};
		
		this.client = new tmi.Client({
			// Turn on if you want to see channel messages and debug info
			// options: { debug: true },
			connection: {
				reconnect: true,
				secure: true,
			},
			identity: {
				username: this.params.botname,
				password: this.params.oAuth,
			},
			channels: [ this.params.channel ],
		});
		
		// Connect to Twitch via tmi.js
		cli.log(`[Twitch] Connecting to channel: ${this.params.channel}`);
		this.client.connect()
			.catch(err => {
				cli.error(`[Twitch] Connection failed: ${err}`);
				this.params = null;
				this.client = null;
			});
		
		// Register to all the tmi.js and SE events that we want to know about
		this._registerToTwitchEvents();
	}
	
	disconnect() {
		if (this.client) {
			this.client.disconnect();
			this.client = null;
			cli.log(`[Twitch] Disconnected from channel: ${this.params.channel}`);
			this.params = null;
		}
	}
	
	// Returns true iff we're currently connected to Twitch
	get isConnected() {
		return this.client !== null;
	}
	
	// Forwards an event from StreamElements, to present a unified interface.
	// This makes it so when we get notified that the given event has occurred,
	// we notify about it here as well.
	// 
	// Parameters:
	// 	eventName		The name of the event to forward from SE.
	_forwardSEEvent(eventName) {
		SEManager.on(eventName, data => this._notify(eventName, data));
	}
	
	_simulateUserMessage(username, message) {
		let userstate = {
			["username"]: username,
			["display-name"]: _.capitalize(username),
			['message-type']: 'chat',
		}
		
		this._processMessage(userstate, message, false);
	}
	
	// Registers to commands given through the command-line interface
	_registerToCliEvents() {
		// Message simulation CLI commands
		cli.on(['m', 'msg', 'message'], message => {
			// Pretend user, completely bogus, no such person ever existed
			this._simulateUserMessage('fluxistence', message);
		});
		cli.on(['u', 'usermsg', 'usermessage'], cmdline => {
			// First parameter is the username, and the rest is the message
			let username = cmdline.split(' ')[0];
			let message = cmdline.substring(username.length).trim();
			this._simulateUserMessage(username, message);
		});
	}
	
	// Registers to all the events in tmi.js that we want to know about.
	_registerToTwitchEvents() {
		// Called on every message sent to the channel chat
		this.client.on('message', (channel, userstate, message, self) => {
			this._processMessage(userstate, message, self);
		});
		
		// Called when a new user joins the channel chat (NOTE: this takes some
		// time to happen, so you may see some messages from a user BEFORE a
		// userJoin event is fired declaring their arrival)
		this.client.on('join', (channel, username, self) => {
			if (!self) this._notify('userJoined', username);
		});
		
		// Called when a user leaves the channel chat (NOTE: this also takes
		// some time to happen)
		this.client.on('part', (channel, username, self) => {
			if (!self) this._notify('userLeft', username);
		});
	}
	
	// Registers to all the events in StreamElements that we want to know about.
	_registerToSEEvents() {
		// Called when someone tips through StreamElements
		this._forwardSEEvent('tip');
		
		// Called when someone follows the channel
		// This is a Twitch event, but for some reason tmi.js doesn't announce
		// it, and StreamElements does, so we just take it from there
		this._forwardSEEvent('follow');
	}
	
	// Makes our bot say something on the channel chat.
	// 
	// Parameters:
	// 	msg		The message to send.
	say(msg) {
		if (this.isConnected) {
			this.client.say(this.channel, msg);
		} else {
			cli.warn(`[Twitch] Can't send message when not connected to Twitch. Message received: ${msg}`)
		}
	}
	
	// Makes our bot say something on the channel chat to the given user.
	// Basically it just adds "@username" at the beginning.
	// 
	// Parameters:
	// 	user	User object representing the user we wish to address.
	// 	msg		The message to send.
	tell(user, msg) {
		this.say(`@${user.displayName} ${msg}`);
	}
	
	// Registers a user command.
	// Users can use commands in the chat to do things.
	// This is where we specify that we want something like that to happen.
	// Generally speaking, if we want something to happen when a user types
	// '!hello', for example (assuming the command prefix is '!'), we need to
	// register the command 'hello' here.
	// This function accepts two parameters: a unique ID that represents this
	// specific registration (the same command can be registered multiple times
	// with different IDs) and a command structure that contains all the
	// information about the command.
	// 
	// cmd structure:
	// 		id			Unique identifier for this command registration
	// 					Note: The same cmdname can be registered for multiple
	// 					commands (so each module can make e.g. '!start' do its
	// 					own thing if desired), but this should be unique across
	// 					ALL registrations - therefore it is recommended to use
	// 					the module's inherited registerCommand() function rather
	// 					than this one, as it adds the name of the module to the
	// 					ID, preventing collision between different modules
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
	// 		silent		Avoid writing a response or logging into the DB
	// 		cooldowns {	Various cooldown values, in milliseconds
	// 			user	The same user can only use the command once in this time
	// 			global	The command can only be invoked once in this time
	// 		}
	registerCommand(id, cmd) {
		assert(!(id in this._commandHandlerIDs),
			`Duplicate command registration for ID "${id}"`);
		
		// Avoid affecting other things when we make changes to the
		// command object
		cmd = _.cloneDeep(cmd);
		
		// Add the ID to the command object if it hasn't been added already
		if (!(id in cmd)) {
			cmd.id = id;
		}
		
		// This is to make all commands case-insensitive
		cmd.cmdname = cmd.cmdname.toLowerCase();
		
		// Each filter can either be a function or a description for a user filter,
		// which is an object that has a .type and an optional .argument parameters
		// that specifies which user filter to use and provides the necessary data
		// if it is needed
		if (cmd.filters) {
			for (let i = 0; i < cmd.filters.length; i++) {
				if (typeof cmd.filters[i] !== 'function') {
					assert(
						cmd.filters[i].type,
						'Bad filter for command: not a function or a filter descriptor.');
					cmd.filters[i] = UserFilters.fromDataSingle(
						cmd.filters[i].type,
						cmd.filters[i].argument);
				}
			}
		} else {
			cmd.filters = [];
		}
		
		cli.debug(`[Twitch] Registering command '${COMMAND_PREFIX}${cmd.cmdname}' for '${id}'`);
		
		// The same command can activate multiple callbacks, so we store a
		// dictionary of ID-to-command to keep track of what needs to be invoked
		// when
		if (!(cmd.cmdname in this._commandHandlers)) {
			this._commandHandlers[cmd.cmdname] = {};
		}
		
		// We keep two variables:
		// 	_commandHandlers:
		// 		For each command name, keeps a dictionary of unique
		//		ID-to-command object. When a user uses a command, this
		//		collection is checked to see which handlers are registered for
		//		it, and then they get handled accordingly.
		//	_commandHandlerIDs:
		//		In order to support deleting registrations, we need to be able
		//		to tell which command is registered under which ID. Instead of
		//		going over all the registered commands to look for the given ID
		//		when unregistering a command, we keep a record of ID-to-cmdname
		//		which we then use to delete the command from the collection it's
		//		in.
		this._commandHandlerIDs[id] = cmd.cmdname;
		this._commandHandlers[cmd.cmdname][id] = cmd;
	}
	
	registerCommandWithAliases(cmd) {
		let aliases = cmd.aliases && [...cmd.aliases] || [];
		if (!aliases.includes(cmd.cmdname)) {
			aliases.unshift(cmd.cmdname);
		}
		
		let originalCmdID = cmd.id;
		let cmdname = cmd.cmdname;
		aliases.forEach(alias => {
			let cmdid = `${originalCmdID} : ${alias}`;
			cmd.id = cmdid;
			cmd.cmdname = alias;
			this.registerCommand(cmdid, cmd);
		});
		
		cmd.cmdname = cmdname;
		cmd.id = originalCmdID;
	}
	
	// Unregisters a previously registered command based on the unique ID given
	// at the time of its registration.
	unregisterCommand(id) {
		assert(id in this._commandHandlerIDs, `Unknown handler ID: ${id}`);
		
		cli.debug(`[Twitch] Unregistering command '${COMMAND_PREFIX}${this._commandHandlerIDs[id]}' for '${id}'`);
		
		delete this._commandHandlers[this._commandHandlerIDs[id]];
		delete this._commandHandlerIDs[id];
		delete this._cooldownData[id];
	}
	
	
	unregisterCommandWithAliases(cmd) {
		let aliases = cmd.aliases && [...cmd.aliases] || [];
		if (!aliases.includes(cmd.cmdname)) {
			aliases.unshift(cmd.cmdname);
		}
		
		aliases.forEach(alias => {
			this.unregisterCommand(`${cmd.id} : ${alias}`);
		});
	}
	
	// Examines a message to see if it has the structure of a command and
	// returns its information in an easy-to-use format if it does.
	// This does NOT check if we actually know the command; it only checks that
	// it *looks* like a command (i.e. starts with the command prefix) and then
	// parses it and puts the various parts in the object it returns.
	// 
	// Parameters:
	// 	msg		A chat message which we want to check for a command structure
	_parseCommand(msg) {
		// This means that the message doesn't fit the command strutcure and is
		// thus not a command at all
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
			// The name of the command (without the prefix)
			cmdname: cmdname,
			
			// Any arguments supplied with the command (all in text form)
			args: args,
			
			// How the command looks in its full form, without any arguments
			fullname: `${COMMAND_PREFIX}${cmdname}`,
		};
	}
	
	// Things to do if the invocation of the command went well
	_commandSuccessful(user, command, handler) {
		// If the command has any cooldowns, they need to be activated
		this._applyCooldowns(user, handler);
		
		// Send a configured message to the chat as defined by the command
		if (handler.message) {
			this.say(handler.createResponse(user, command, handler));
		}
	}
	
	// Once we know something is, indeed, a command, and has passed basic tests
	// for running (filters, cooldowns), this is where we handle invoking it,
	// taking the points for it, etc.
	// 
	// Parameters:
	// 	user		User object representing the user who invoked the command.
	// 	command		Command object returned by _parseCommand for this command.
	// 	handler		The object we saved in our commands collection which
	// 				describes the command in detail.
	_handleCommand(user, command, handler) {
		// When we invoke the callback for the command, the first parameter
		// always needs to be the User object for the user who invoked the
		// command, so here we construct the full arguments array by prepending
		// said User object
		let fullargs = [user].concat(command.args);
		
		// Handle commands with a cost
		if (handler.cost && handler.cost > 0) {
			// Attempt to deduct the cost of the command from the user
			SEManager.consumeUserPoints(
				user.name,
				handler.cost,
				// Success
				() => {
					// If the command is silent, no response is sent to the chat
					// nor is an entry added to the database log
					if (!handler.silent) {
						// DBLog.info(`${user.name} invoked ${command.cmdname} for ${handler.cost} - had ${oldAmount}, now has ${newAmount}.`);
					}
					
					// Now that everything is finished, we can finally invoke
					// the command
					handler.callback.apply(null, fullargs);
					
					// At this point, if nothing went wrong during the callback
					// invocation, the command has successfully run
					this._commandSuccessful(user, command, handler);
				},
				// Failure do to lack of points
				(amount, points) => {
					this.tell(user, `You do not have enough ${SEManager.POINTS_NAME} to use the ${command.fullname} command. (${points} / ${amount})`);
				},
				// Failure due to a program error
				error => {
					cli.error(`[Twitch] Failed to consume user points: ${error}`);
				});
		// Handle free commands
		} else {
			// Here we only need to invoke the command and we're done
			handler.callback.apply(null, fullargs);
			this._commandSuccessful(user, command, handler);
		}
	}
	
	// Returns true iff the user is currently allowed to use the command at the
	// moment.
	// 
	// Parameters:
	// 	user		User object of the user who invoked the command.
	// 	handler		A full description of the command as it was registered (see
	// 				registerCommand for the full details on this object).
	_checkCooldowns(user, handler) {
		// No cooldown data means the command has no cooldowns
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
	// has successfully been invoked).
	// The way we implement this is by saving the next time a command may be
	// used and comparing the current time with it when we wish to determine
	// whether it can be used at any point.
	// 
	// Parameters:
	// 	user		User object of the user who invoked the command.
	// 	handler		A full description of the command as it was registered (see
	// 				registerCommand for the full details on this object).
	_applyCooldowns(user, handler) {
		// No cooldown data means the command has no cooldowns
		if (handler.cooldowns) {
			// We save current cooldown information (global and per user) in
			// this._cooldownData with keys being the command's unique ID - if
			// there is no information here yet, this is where we create it
			let cooldownData = this._cooldownData[handler.id] || {};
			
			// This means there are user-specific cooldowns
			if (handler.cooldowns.user) {
				// Make sure that we have where to store the data for the
				// current user
				if (!cooldownData.users) {
					cooldownData.users = {};
				}
				
				// Specify that the given user may not use this command until
				// handler.cooldowns.user milliseconds have passed
				cooldownData.users[user.name] =
					Utils.now() + handler.cooldowns.user;
			}
			
			// This means there is a global cooldown - that is, when someone
			// invokes the command, no-one else may invoke it until this
			// cooldown period is over
			if (handler.cooldowns.global) {
				// Specify that no user may use this command until
				// handler.cooldowns.global milliseconds have passed
				cooldownData.global = Utils.now() + handler.cooldowns.global;
			}
			
			// Save the information we just created/updated
			this._cooldownData[handler.id] = cooldownData;
		}
	}
	
	// Removes expired cooldowns periodically.
	// This function goes over all the information in this._cooldownData and
	// deletes any entry it finds which points to a time in the past, as that
	// means that it is no longer relevant.
	// 
	// When we delete something, it is possible that the object that contained
	// it is left empty. We test for this and remove the entire object if so.
	_cleanupCooldowns() {
		let now = Utils.now();
		
		Object.keys(this._cooldownData).forEach(id => {
			let cdd = this._cooldownData[id];
			
			if (cdd.users) {
				Object.keys(cdd.users).forEach(username => {
					if (cdd.users[username] < now) {
						delete cdd.users[username];
					}
				});
				
				if (_.isEmpty(cdd.users)) {
					delete cdd.users;
				}
			}
			
			if (cdd.global) {
				if (cdd.global < now) {
					delete cdd.global;
				}
			}
			
			if (_.isEmpty(cdd)) {
				delete this._cooldownData[id];
			}
		});
	}
	
	// Takes a parsed command, makes sure that the user who invoked it may use
	// it and relays the request to _handleCommand if so.
	// This is basically a gateway filtering out invalid use of commands.
	// 
	// Parameters:
	// 	user		User object representing the user who invoked the command.
	// 	command		Command object returned by _parseCommand for this command.
	_invokeCommand(user, command) {
		// If the message that was sent is not a command at all, this will be
		// null
		if (command === null) {
			return false;
		}
		
		// This will be our return value
		// Returning true means that the message is indeed a command and should
		// be treated as such
		let isCommand = false;
		
		// Check if any handlers have been registered for this command
		// and invoke them if so
		if (command.cmdname in this._commandHandlers) {
			isCommand = true;
			
			// Only handle this command if it passes the filters and is not
			// currently on cooldown (either for the user or globally)
			Object.values(this._commandHandlers[command.cmdname]).forEach(
				handler => {
					// This reduction performs an "or" operation between the
					// return values of all the filters and only proceeds if
					// any of them returns true (or if there aren't any)
					if (handler.filters.length === 0 ||
						handler.filters.reduce(
							(soFar, currentFilter) => soFar || currentFilter(user),
							false)) {
								// Make sure the user can use this command right now
								// (this does initiate any cooldowns; it just checks
								// to see that it's not currently on cooldown)
								if (this._checkCooldowns(user, handler)) {
									this._handleCommand(user, command, handler);
								}
					}
				});
		}
		
		// Let every module examine the command and invoke it if it's one of
		// its commands - if any of them did, then this is a command
		Object.values(ModuleManager.modules).forEach(module => {
			isCommand = isCommand || module.invokeCommand(user, command);
		});
		
		// The handlers registered with the commands and the dynamic invocations
		// are all finished already - this is a general 'command' event that can
		// be listened to if anything wants to know when a command is invoked in
		// general
		if (isCommand) {
			// Invoke the general command handlers
			this._notify('command', user, command.cmdname, command.args);
		}
		
		return isCommand;
	}
	
	// Examines every message on the Twitch channel chat and delegates the
	// various types to whatever should deal with hem.
	// 
	// Parameters:
	// 	userstate	The userstate object obtained from tmi.js for this message.
	// 				For more details see the tmi.js documentation.
	// 	message		The text contents of the message itself.
	// 	self		A boolean value specifying whether we are the ones who have
	// 				sent this message. This generally means that we should
	// 				ignore it.
	_processMessage(userstate, message, self) {
		try {
			if(self) return;
			
			// Create an internal User object out of the external userstate
			// object, to have a friendlier interface
			let user = new User(userstate);
			
			// noinspection FallThroughInSwitchStatementJS
			switch(userstate['message-type']) {
				// This is what we get when someone types "/me <message>"
				case 'action':
					this._notify('action', user, message);
					break;
				default:
					cli.warn("[Twitch] Unknown message type received; treating as regular message.");
				case 'whisper':
				case 'chat':
					// We want to let various message type handlers all examine
					// this but not to register it as a regular message when
					// they're done if one if them considers it special, so we
					// use this to keep track of whether it's just a regular
					// message or not
					let regularMessage = true;
					
					// Check if this is a channel reward redemption
					// This is only possible when the redemption comes with
					// a message, otherwise it wouldn't be sent to us at all
					// through tmi.js and we ned PubSub to see it - something
					// that is not yet implemented
					if (userstate['custom-reward-id']) {
						if (this.printRewardIDs) {
							cli.log('[Twitch] Reward redeemed:');
							cli.log(`[Twitch]   ID: ${userstate['custom-reward-id']}`);
							cli.log(`[Twitch]   Message: ${message}`);
						}
						
						this._notify(
							'channelReward',
							user,
							userstate['custom-reward-id'],
							message);
						
						regularMessage = false;
					}
					
					// Check if this is a command and invoke it if so - only
					// proceed to treat this as a regular message if it's not
					// a command
					let command = this._parseCommand(message);
					if (this._invokeCommand(user, command)) {
						regularMessage = false;
					}
					
					if (regularMessage) {
						this._notify('message', user, message);
					}
					
					break;
			}
			
			// if(message.toLowerCase() === '!hello') {
			// 	client.say(channel, `@${tags.username}, heya!`);
			// }
		}
		// General try-catch to catch everything so that nothing causes the
		// server to crash
		catch (err) {
			cli.error(`[Twitch] ${err}`);
		}
	}
}

module.exports = new TwitchManager();
