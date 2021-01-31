const fs = require('fs');
const path = require('path');
const EventNotifier = require('./eventNotifier');
const cli = require('./cliManager');
const TwitchManager = require('./twitchManager');

// This file needs to contain { rewardId: rewardName } pairs that match a custom
// reward ID to a name that represents it.
// (The rewardName doesn't actually need to be the same name that the reward has
// on Twitch - you just need to make sure that whatever registers to the reward
// in question uses the same name as what's in the file.)
// To see what the custom reward ID is for the reward of your choice, you can
// either enable printing reward IDs on TwitchManager or visit this website:
//  https://www.instafluff.tv/TwitchCustomRewardID/?channel=YOURTWITCHCHANNEL
// (replace YOURTWITCHCHANNEL with the name of your Twitch channel).
// Once you do, redeem the reward you want and you should be able to see the
// ID for that reward show up along with your message (the message is required).
const REWARDS_FILENAME = 'channelRewardIDs.json';

// Use this if you want to be notified when users redeem a channel points reward
// on the stream.
// 
// NOTE: Currently this only supports rewards that are requested with a message.
// Reward redemptions that come with a message show up through tmi.js as
// messages with a 'custom-reward-id' field, so they're simple to recognize and
// handle, but rewards without a message don't show up through tmi.js at all.
// In order to be notified about *all* reward redemptions, we need to use
// Twitch's PubSub service, which is currently not supported here.
// See pubsubs.js for more details.
class RewardsManager extends EventNotifier {
	constructor() {
		super(false, true);
		this.rewards = {};
	}
	
	// Reads the rewards data from file.
	// No notifications will be made until this is called.
	init() {
		try {
			this.rewards = JSON.parse(fs.readFileSync(path.join(
				__dirname,
				REWARDS_FILENAME)));
		} catch (err) {
			cli.error('Failed to read rewards file:');
			cli.error(err);
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
