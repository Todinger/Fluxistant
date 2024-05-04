const Trigger = require('./functionTrigger');
const StreamRaidersManager = requireMain('./streamRaidersManager');

class StreamRaidersBattleEndedTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersBattleEnded";
	}
	
	_activateImpl() {
		StreamRaidersManager.onBattleEnded(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeBattleEndedCallback(this.callback);
	}
	
	_invoked() {
		this._triggerDefault();
	}
}

module.exports = StreamRaidersBattleEndedTrigger;
