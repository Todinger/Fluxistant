const Trigger = require('./functionTrigger');
const Variable = require('../Variables/functionVariable');
const TwitchManager = requireMain('./twitchManager');

class MessageTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.text = settings && settings.text || "";
		this.text = this.text.toLowerCase();
		this.exact = !!(settings && settings.exact);
		this.regex = !!(settings && settings.regex);
		this.callback = (...params) => this._onMessage(...params);
		
		// If this is supposed to be a regex that matches the string exactly
		// then it should be in the form of "^SomeRegularExpression$", so if
		// it's not then we add the missing prefix/suffix
		if (this.regex) {
			if (this.exact) {
				if (!this.text.startsWith('^')) {
					this.text = '^' + this.text;
				}
				if (!this.text.endsWith('$')) {
					this.text = this.text + '$';
				}
			}
			
			this.regexText = new RegExp(this.text, 'i');
		}
	}
	
	get type() {
		return "message";
	}
	
	_onMessage(user, message) {
		let triggerParams = null;
		let trigger = false;
		
		if (this.regex) {
			let matches = this.regexText.exec(message);
			if (matches) {
				triggerParams = {
					groups: matches,
				};
				
				trigger = true;
			}
		} else {
			message = message.toLowerCase();
			if (this.exact) {
				trigger = message === this.text;
			} else {
				trigger = message.includes(this.text);
			}
		}
		
		if (trigger) {
			this._trigger({
				user: user,
				triggerParams: triggerParams,
			});
		}
	}
	
	_activateImpl() {
		TwitchManager.on('message', this.callback);
	}
	
	_deactivateImpl() {
		TwitchManager.removeCallback('message', this.callback);
	}
	
	variables = [
		new Variable({
			name: 'Captured Group (`$g0`, `$g1`, `$g2`, `$g3`, ...)',
			description: 'Returns one of the groups captured when regular expressions are used. Accepts any number as the index.',
			example: 'For a regex trigger defined as "Hello (.*), (.*)!" with the message "Hello there, neighbor!", the response "$2, you are helloed $1." will produce "neighbor, you are helloed there." $0 always produces the entire captured text.',
			condition: 'Can only be used when activated by a chat message, and only if it is marked as a regular expression.',
			
			expr: /\$g(\d+)/,
			replacement: data => {
				let groups = data.context.params.trigger.groups;
				let num = Number(data.matchData[1]); // Skip the 'g' prefix
				if (0 <= num && num < groups.length && groups[num] !== undefined) {
					return groups[num];
				} else {
					return data.matchString; // Return the expression unchanged
				}
			},
		}),
	]
}

module.exports = MessageTrigger;
