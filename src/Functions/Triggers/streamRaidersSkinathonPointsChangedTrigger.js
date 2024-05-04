const Trigger = require('./functionTrigger');
const Variable = require("../Variables/functionVariable");
const StreamRaidersManager = requireMain('./streamRaidersManager');
const Globals = requireMain('./globals');

class StreamRaidersSkinathonPointsChangedTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersSkinathonPointsChanged";
	}
	
	_activateImpl() {
		StreamRaidersManager.onSkinathonPointsChanged(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeSkinathonPointsChangedCallback(this.callback);
	}
	
	_invoked(newPoints, oldPoints) {
		this._trigger({
			user: Globals.StreamerUser,
			triggerParams: {
				old: oldPoints,
				new: newPoints,
			},
		});
	}

	variables = [
		new Variable({
			name: 'Old Points (`$old`)',
			description: 'The total amount of Skin Points before the change',
			example: '"We are no longer in the $old-SP rut!" will show e.g. "We are no longer in the 420-SP rut!"',
			condition: 'Can only be used when activated by Skin-Point change during a Stream Raiders skinathon.',

			expr: '$old',
			replacement: data => data.context.params.trigger.old,
		}),
		new Variable({
			name: 'New Points (`$new`)',
			description: 'The total amount of Skin Points after the change',
			example: '"We now have $new SP!" will show e.g. "We now have 459 SP!"',
			condition: 'Can only be used when activated by Skin-Point change during a Stream Raiders skinathon.',

			expr: '$new',
			replacement: data => data.context.params.trigger.new,
		}),
	]
}

module.exports = StreamRaidersSkinathonPointsChangedTrigger;
