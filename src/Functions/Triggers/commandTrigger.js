const Trigger = require('./functionTrigger');
const Variable = require('../Variables/functionVariable');
const TwitchManager = requireMain('./twitchManager');
const SEManager = requireMain('./seManager');

class CommandTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.cmdid = this.commandID;
		this.cmdname = settings.cmdname;
		this.callback = (...params) => this._invoked(...params);
		this.cost = settings.cost || 0;
		this.aliases = settings.aliases || [];
		
		this.command = {
			id: this.cmdid,
			cmdname: this.cmdname,
			callback: this.callback,
			filters: [this.filter],
			cost: this.cost,
			cooldowns: this.cooldowns,
			aliases: this.aliases,
		};
	}
	
	get type() {
		return "command";
	}
	
	get commandID() {
		return `<Trigger> ${this.triggerID}`;
	}
	
	_activateImpl() {
		TwitchManager.registerCommandWithAliases(this.command);
	}
	
	_deactivateImpl() {
		TwitchManager.unregisterCommandWithAliases(this.command);
	}
	
	_invoked(user, ...args) {
		this._trigger({
			user: user,
			// cmdname: cmdname,
			params: [...args],
			triggerParams: {
				cost: this.command.cost,
				cmdname: this.command.cmdname,
			}
		});
	}
	
	variables = [
		new Variable({
			name: 'Command Name ($cmdname)',
			description: 'The name of the command trigger used to invoke the function.',
			example: '"Did you enjoy that? Then do !$cmdname again!" -- for the command !hi --> "Did you enjoy that? Then do !hi again!"',
			
			expr: '$cmdname',
			replacement: data => data.context.params.trigger.cmdname,
		}),
		
		new Variable({
			name: 'Cost ($cost)',
			description: 'The amount of StreamElements loyalty points that the user spent to use the command.',
			example: 'For the message "Ha! You just wasted your $cost point(s)!" on a command that cost 30, the bot will say "Ha@ You just wasted you 30 point(s)!',
			
			expr: '$cost',
			replacement: data => data.context.params.trigger.cost.toString(),
			// 	if (data.context.params.trigger &&
			// 		data.context.params.trigger.cost) {
			// 		return data.context.params.trigger.cost.toString();
			// 	} else {
			// 		// If the function wasn't activated by a command then this
			// 		// variable is irrelevant and shouldn't do anything
			// 		return '$cost';
			// 	}
			// },
		}),
		
		new Variable({
			name: 'Cost in Points ($pcost)',
			description: 'The amount of StreamElements loyalty points that the user spent to use the command, along with the name of the points, adjusted for amounts.',
			example: 'For the message "Ha! You just wasted your $pcost!" on a command that cost 30, and assuming the name of your SE points is "pixels", the bot will say "Ha! You just wasted you 30 pixels!" If the cost is 1, it will say "Ha! You just wasted your 1 pixel!',
			
			expr: '$pcost',
			replacement: data => SEManager.pointsString(data.context.params.trigger.cost),
			// 	if (data.context.params.trigger &&
			// 		data.context.params.trigger.cost) {
			// 		return SEManager.pointsString(data.context.params.trigger.cost);
			// 	} else {
			// 		// If the function wasn't activated by a command then this
			// 		// variable is irrelevant and shouldn't do anything
			// 		return '$pcost';
			// 	}
			// },
		}),
	]
}

module.exports = CommandTrigger;
