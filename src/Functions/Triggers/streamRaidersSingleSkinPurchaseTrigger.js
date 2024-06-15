const Trigger = require('./functionTrigger');
const SRVars = require("./streamRaidersPurchaseVariables");
const StreamRaidersManager = requireMain('./streamRaidersManager');
const Globals = requireMain('./globals');

class StreamRaidersSingleSkinPurchaseTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersSingleSkinPurchase";
	}
	
	_activateImpl() {
		StreamRaidersManager.onSingleSkinPurchase(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeSingleSkinPurchaseCallback(this.callback);
	}
	
	_invoked(skinPurchaseDetails) {  // Type: SkinPurchaseDetails
		this._trigger({
			user: Globals.StreamerUser,
			triggerParams: skinPurchaseDetails,
		});
	}

	variables = SRVars.common.concat([
		SRVars.skin,
		SRVars.unit,
		SRVars.color,
	])
}

module.exports = StreamRaidersSingleSkinPurchaseTrigger;
