const Trigger = require('./functionTrigger');
const Variable = require('../Variables/functionVariable');
const CLI = requireMain('./cliManager');
const Globals = requireMain('./globals');
const Utils = requireMain('./utils');

class CliTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.cmdname = settings && settings.cmdname;
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "cli";
	}
	
	_activateImpl() {
		CLI.on(this.cmdname, this.callback);
	}
	
	_deactivateImpl() {
		CLI.removeCallback(this.cmdname, this.callback);
	}
	
	_invoked(line) {
		let args = Utils.isNonEmptyString(line) ? line.split(/\s+/) : [];
		
		this._trigger({
			user: Globals.StreamerUser,
			params: args,
			triggerParams: {
				cliname: this.cmdname,
			},
		});
	}
	
	variables = [
		new Variable({
			name: 'Command Name (`$cliname`)',
			description: 'The name of the CLI command trigger used to invoke the function.',
			example: '"Did you know that typing `$cliname` in the bot console shows this message?! =O',
			condition: 'Can only be used when activated by a CLI command.',
			
			expr: '$cliname',
			replacement: data => data.context.params.trigger.cliname,
		}),
	]
}

module.exports = CliTrigger;
