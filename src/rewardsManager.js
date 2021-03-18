const assert = require('assert').strict;
const EventNotifier = require('./eventNotifier');
const TwitchManager = require('./twitchManager');

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
		super(true, true);
		this.rewards = {};
	}
	
	// Reads the rewards data from file.
	// No notifications will be made until this is called.
	init(rewardsList) {
		this.rewards = {};
		if (rewardsList) {
			rewardsList.forEach(reward => {
				this.rewards[reward.rewardID] = reward.rewardName;
			});
		}
		
		this.listeningForReward = false;
		this.rewardListenCallback = null;
		
		TwitchManager.on(
			'channelReward',
			(user, rewardID, msg) => this._rewardRedeemed(user, rewardID, msg));
	}
	
	verifyPresence(rewardID) {
		assert(
			rewardID in this.rewards,
			`Unknown reward ID: ${rewardID}`);
	}
	
	verifyAbsence(rewardID) {
		assert(
			!(rewardID in this.rewards),
			`Duplicate reward ID: ${rewardID}`);
	}
	
	addReward(rewardID, name) {
		this.verifyAbsence(name);
		this.rewards[rewardID] = name;
	}
	
	getRewardName(rewardID) {
		this.verifyPresence(rewardID);
		return this.rewards[rewardID];
	}
	
	setRewardName(rewardID, name) {
		this.verifyPresence(rewardID);
		this.rewards[rewardID] = name;
	}
	
	setRewards(rewards) {
		assert(
			typeof rewards === 'object',
			`Invalid rewards data received: ${rewards}`);
		this.rewards = rewards;
	}
	
	listenForReward(callback) {
		this.listeningForReward = true;
		this.rewardListenCallback = callback;
	}
	
	stopListeningForReward() {
		this.listeningForReward = false;
		this.rewardListenCallback = null;
	}
	
	isListeningForReward() {
		return this.listeningForReward;
	}
	
	_notifyRedemption(user, rewardID, msg) {
		let rewardName = this.rewards[rewardID];
		
		// We don't necessarily have information on all the rewards in the
		// channel, so if one is redeemed that we don't know we just ignore it
		// rather than give a warning or an error
		if (rewardID) {
			this._notify(rewardID, rewardID, rewardName, user, msg);
		}
	}
	
	_rewardRedeemed(user, rewardID, msg) {
		if (this.listeningForReward && this.rewardListenCallback) {
			this.rewardListenCallback(user, rewardID, msg);
		}
		
		this._notifyRedemption(user, rewardID, msg);
	}
}

module.exports = new RewardsManager();
