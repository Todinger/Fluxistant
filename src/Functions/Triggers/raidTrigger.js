const Trigger = require('./functionTrigger');
const Variable = require('../Variables/functionVariable');
const TwitchManager = requireMain('./twitchManager');
const User = requireMain('user').User;

class HostTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.raidCallback =
			(username, viewers) => this._raided(username, viewers);
	}
	
	get type() {
		return "raid";
	}
	
	_activateImpl() {
		TwitchManager.on('raid', this.raidCallback);
	}
	
	_deactivateImpl() {
		TwitchManager.removeCallback('raid', this.raidCallback);
	}
	
	_raided(username, viewers) {
		this._trigger({
			user: User.fromUsername(username),
			triggerParams: {
				viewers,
			},
		});
	}
	
	variables = [
		new Variable({
			name: 'Viewer Count (`$viewers`)',
			description: 'The number of viewers raiding the channel',
			example: '"Thank you for raiding us with your party of $viewers viewers, $user!" will show e.g. "Thank you for raiding us with your party of 31 viewers, fluxistence!"',
			condition: 'Can only be used when activated by a raid on Twitch.',
			
			expr: '$viewers',
			replacement: data => data.context.params.trigger.viewers,
		}),
	]
}

module.exports = HostTrigger;
