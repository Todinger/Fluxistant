const ValueEntity = require('./Values/valueEntity');

class ChannelRewardSelectionEntity extends ValueEntity {
	static get TYPE()		{ return 'ChannelRewardSelection'; 							}
	static get GUITYPE()	{ return 'ChannelRewardSelection'; 							}
	static get BUILDER()	{ return value => new ChannelRewardSelectionEntity(value); 	}
	
	constructor(value) {
		super(value);
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		return this.getValue();
	}
}

module.exports = ChannelRewardSelectionEntity;
