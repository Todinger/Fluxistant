const TriggerEntity = require('./triggerEntity');

class Trigger_StreamRaidersPurchaseBaseEntity extends TriggerEntity {
	static get TYPE()		{ return null;	} // Abstract type, avoid instantiation

	constructor(name, allowedFilters) {
		super(name, {allowedFilters});
		this.alwaysShowFilters();
	}
}

module.exports = Trigger_StreamRaidersPurchaseBaseEntity;
