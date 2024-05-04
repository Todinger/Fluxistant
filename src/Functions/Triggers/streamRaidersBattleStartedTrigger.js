const Trigger = require('./functionTrigger');
const StreamRaidersManager = requireMain('./streamRaidersManager');

class StreamRaidersBattleStartedTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersBattleStarted";
	}
	
	_activateImpl() {
		StreamRaidersManager.onBattleStarted(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeBattleStartedCallback(this.callback);
	}
	
	_invoked() {
		this._triggerDefault();
	}
}

module.exports = StreamRaidersBattleStartedTrigger;
