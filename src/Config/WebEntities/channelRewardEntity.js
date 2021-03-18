const StaticObjectEntity = require('./staticObjectEntity');

class ChannelRewardEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'ChannelReward'; 							}
	static get GUITYPE()	{ return 'ChannelReward'; 							}
	static get BUILDER()	{ return (...p) => new ChannelRewardEntity(...p); 	}
	
	constructor(rewardDetails) {
		super();
		this.addTextDisplay('rewardID', rewardDetails && rewardDetails.rewardID || undefined)
			.setName('Reward ID')
			.setDescription('A unique string that identifies the reward on Twitch');
		this.addString('rewardName', rewardDetails && rewardDetails.rewardName || undefined)
			.setName('Name')
			.setDescription("Name this however you like, it's for you to recognize this reward");
	}
	
	getRewardID() {
		return this.getChild('rewardID').getValue();
	}
	
	setRewardID(rewardID) {
		this.getChild('rewardID').setValue(rewardID);
	}
	
	getRewardName() {
		return this.getChild('rewardName').getValue();
	}
	
	setRewardName(rewardName) {
		this.getChild('rewardName').setValue(rewardName);
	}
}

module.exports = ChannelRewardEntity;
