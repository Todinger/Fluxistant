const fs = require('fs');
const path = require('path');
const EventNotifier = require('./eventNotifier');
const TwitchManager = require('./twitchManager');

const REWARDS_FILENAME = 'channelRewardIDs.json';

// NOTE: Currently this only supports rewards that are requested with a message
class RewardsManager extends EventNotifier {
	constructor() {
		super(false, true);
		this.rewards = {};
	}
	
	init() {
		try {
			this.rewards = JSON.parse(fs.readFileSync(path.join(
				__dirname,
				REWARDS_FILENAME)));
		} catch (err) {
			console.error('Failed to read rewards file:');
			console.error(err);
			return;
		}
		
		this._addEvents(Object.values(this.rewards));
		
		TwitchManager.on(
			'channelReward',
			(user, rewardID, msg) => this._rewardRedeemed(user, rewardID, msg));
	}
	
	_rewardRedeemed(user, rewardID, msg) {
		let rewardName = this.rewards[rewardID];
		
		// We don't necessarily have information on all the rewards in the
		// channel, so if one is redeemed that we don't know we just ignore it
		// rather than give a warning or an error
		if (rewardName) {
			this._notify(rewardName, user, msg);
		}
	}
}

module.exports = new RewardsManager();
