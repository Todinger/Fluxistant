const TriggerEntity = require('./triggerEntity');

class Trigger_ChannelRewardEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_ChannelReward'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_ChannelRewardEntity(...p); 	}
	
	constructor(data) {
		super('Channel Reward');
		this.setDescription('Activates this function when the selected channel reward is redeemed');
		this.add('rewardID', 'ChannelRewardSelection')
			.setName('Reward')
			.setDescription('Name of the channel reward which will activate this function');
		
		this.setData(data);
	}
	
	setData(data) {
		super.setData(data);
		if (data && data.rewardID) {
			this.getChild('rewardID').setValue(data.rewardID);
		}
	}
}

module.exports = Trigger_ChannelRewardEntity;
