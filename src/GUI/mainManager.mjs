import EventNotifier from "/common/eventNotifier.mjs";

class MainManager extends EventNotifier {
	constructor() {
		super();
		this.configurator = null;
		this.rewardListener = null;
	}
	
	init(configurator) {
		this.configurator = configurator;
	}
	
	listenForReward(rewardListener) {
		if (!this.rewardListener) {
			this.configurator.listenForReward();
		}
		
		this.rewardListener = rewardListener;
	}
	
	stopListeningForReward() {
		if (this.rewardListener) {
			this.rewardListener.stopListeningForReward();
			this.configurator.stopListeningForReward();
			this.rewardListener = null;
		}
	}
	
	isListeningForReward() {
		return this.rewardListener !== null;
	}
	
	rewardRedeemed(rewardID) {
		if (this.rewardListener) {
			this.rewardListener.rewardRedeemed(rewardID);
		}
		
		this.rewardListener = null;
	}
	
	getRewardsList() {
		return this.configurator.getRewardsList();
	}
	
	onRewardsChanged(callback) {
		this.on('rewardsChanged', callback);
	}
	
	rewardsChanged() {
		this._notify('rewardsChanged', this.getRewardsList());
	}
}

const mainManager = new MainManager();
export default mainManager;
