const Trigger = require('./functionTrigger');
const SRVars = require("./streamRaidersPurchaseVariables");
const StreamRaidersManager = requireMain('./streamRaidersManager');
const Globals = requireMain('./globals');

class StreamRaidersSkinGiftTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.callback = (...params) => this._invoked(...params);
	}
	
	get type() {
		return "streamRaidersSkinGift";
	}
	
	_activateImpl() {
		StreamRaidersManager.onSkinGift(this.callback);
	}
	
	_deactivateImpl() {
		StreamRaidersManager.removeSkinGiftCallback(this.callback);
	}
	
	_invoked(skinPurchaseDetails) {  // Type: SkinGiftDetails
		this._trigger({
			user: Globals.StreamerUser,
			triggerParams: skinPurchaseDetails,
		});
	}

	variables = SRVars.common.concat([
		SRVars.recipient,
	])
}

module.exports = StreamRaidersSkinGiftTrigger;
