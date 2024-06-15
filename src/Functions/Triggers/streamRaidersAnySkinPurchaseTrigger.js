const Trigger = require('./functionTrigger');
const SRVars = require("./streamRaidersPurchaseVariables");
const StreamRaidersManager = requireMain('./streamRaidersManager');
const Globals = requireMain('./globals');

class StreamRaidersAnySkinPurchaseTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersAnySkinPurchase";
	}
	
	_activateImpl() {
		StreamRaidersManager.onAnySkinPurchase(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeAnySkinPurchaseCallback(this.callback);
	}
	
	_invoked(skinPurchaseDetails) {  // Type: SkinPurchaseDetailsBase
		this._trigger({
			user: Globals.StreamerUser,
			triggerParams: skinPurchaseDetails,
		});
	}

	variables = SRVars.common
}

module.exports = StreamRaidersAnySkinPurchaseTrigger;
