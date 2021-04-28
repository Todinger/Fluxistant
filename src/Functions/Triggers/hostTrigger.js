const Trigger = require('./functionTrigger');
const Variable = require('../Variables/functionVariable');
const TwitchManager = requireMain('./twitchManager');
const User = requireMain('user').User;

class HostTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.hostCallback =
			(username, viewers, autohost) => this._hosted(username, viewers, autohost);
	}
	
	get type() {
		return "host";
	}
	
	_activateImpl() {
		TwitchManager.on('host', this.hostCallback);
	}
	
	_deactivateImpl() {
		TwitchManager.removeCallback('host', this.hostCallback);
	}
	
	_hosted(username, viewers, autohost) {
		this._trigger({
			user: User.fromUsername(username),
			triggerParams: {
				viewers,
				autohost,
			},
		});
	}
	
	variables = [
		new Variable({
			name: 'Viewer Count (`$viewers`)',
			description: 'The number of viewers watching the hosted channel',
			example: '"Thank you for hosting us to your $viewers viewers, $user!" will show e.g. "Thank you for hosting us to your 31 viewers, fluxistence!"',
			condition: 'Can only be used when activated by a host on Twitch.',
			
			expr: '$viewers',
			replacement: data => data.context.params.trigger.viewers,
		}),
	]
}

module.exports = HostTrigger;
