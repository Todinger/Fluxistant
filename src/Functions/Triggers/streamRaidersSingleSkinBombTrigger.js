const Trigger = require('./functionTrigger');
const SRVars = require("./streamRaidersPurchaseVariables");
const StreamRaidersManager = requireMain('./streamRaidersManager');
const Globals = requireMain('./globals');

class StreamRaidersSingleSkinBombTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersSingleSkinBomb";
	}
	
	_activateImpl() {
		StreamRaidersManager.onSingleSkinBomb(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeSingleSkinBombCallback(this.callback);
	}
	
	_invoked(skinPurchaseDetails) {  // Type: SkinBombSingleDetails
		this._trigger({
			user: Globals.StreamerUser,
			triggerParams: skinPurchaseDetails,
		});
	}

	variables = SRVars.common.concat([
		SRVars.skin,
		SRVars.unit,
		SRVars.recipient,
	])
}

module.exports = StreamRaidersSingleSkinBombTrigger;
