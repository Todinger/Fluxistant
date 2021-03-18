const DynamicArrayEntity = require('./dynamicArrayEntity');

class ChannelRewardDefinitionEntity extends DynamicArrayEntity {
	static get TYPE()		{ return 'ChannelRewardDefinition'; 							}
	static get GUITYPE()	{ return 'ChannelRewardDefinition'; 							}
	static get BUILDER()	{ return (...p) => new ChannelRewardDefinitionEntity(...p); 	}
	
	constructor() {
		super('ChannelReward');
	}
}

module.exports = ChannelRewardDefinitionEntity;
