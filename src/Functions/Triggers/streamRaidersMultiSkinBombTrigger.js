const Trigger = require('./functionTrigger');
const SRVars = require("./streamRaidersPurchaseVariables");
const StreamRaidersManager = requireMain('./streamRaidersManager');
const Globals = requireMain('./globals');

class StreamRaidersMultiSkinBombTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersMultiSkinBomb";
	}
	
	_activateImpl() {
		StreamRaidersManager.onMultiSkinBomb(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeMultiSkinBombCallback(this.callback);
	}
	
	_invoked(skinPurchaseDetails) {  // Type: SkinBombMultiDetails
		this._trigger({
			user: Globals.StreamerUser,
			triggerParams: skinPurchaseDetails,
		});
	}

	variables = SRVars.common.concat([
		SRVars.amount,
	])
}

module.exports = StreamRaidersMultiSkinBombTrigger;
