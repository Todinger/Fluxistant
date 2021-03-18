const Trigger = require('./functionTrigger');
const Variable = require('../Variables/functionVariable');
const RewardsManager = requireMain('./rewardsManager');
const Utils = requireMain('utils');

class ChannelRewardTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.rewardID = settings && settings.rewardID;
		this.rewardRedeemedHandler = (...p) => this._rewardRedeemed(...p);
	}
	
	get type() {
		return "reward";
	}
	
	_rewardRedeemed(rewardID, rewardName, user, msg) {
		this._trigger({
			user: user,
			params: (msg && Utils.splitIntoWords(msg)) || [],
			triggerParams: {
				rewardID,
				rewardName,
			},
		});
	}
	
	_registerForChannelReward() {
		if (this.rewardID) {
			RewardsManager.on(this.rewardID, this.rewardRedeemedHandler);
		}
	}
	
	_unregisterForChannelReward() {
		if (this.rewardID) {
			RewardsManager.removeCallback(this.rewardID, this.rewardRedeemedHandler);
		}
	}
	
	_activateImpl() {
		this._registerForChannelReward();
	}
	
	_deactivateImpl() {
		this._unregisterForChannelReward();
	}
	
	variables = [
		new Variable({
			name: 'Reward ID (`$rewardID`)',
			description: 'The unique string assigned by Twitch to identify the reward',
			example: '"Twitch is weird. It calls this reward $rewardID." ---example ID---> "Twitch is weird. It calls this reward f4b3583a-2db5-44db-aa22-d4dcd4c65ef6."',
			condition: 'Can only be used when activated by a channel reward redemption.',
			
			expr: '$rewardID',
			replacement: data => data.context.params.trigger.rewardID,
		}),
		
		new Variable({
			name: 'Reward Name ($reward)',
			description: "The name you've assigned for this reward in the configuration.",
			example: `"Isn't my $reward reward the best? :O" ---For reward "Yay"---> "Isn't my Yay reward the best? :O"`,
			condition: 'Can only be used when activated by a channel reward redemption.',
			
			expr: '$reward',
			replacement: data => data.context.params.trigger.rewardName,
		}),
	]
}

module.exports = ChannelRewardTrigger;
