import EventNotifier from "/common/eventNotifier.mjs";

class MainManager extends EventNotifier {
	constructor() {
		super();
		this.configurator = null;
		this.rewardListener = null;
		this.helpData = null;
	}
	
	init(configurator) {
		this.configurator = configurator;
	}
	
	// --------- Channel Rewards --------- //
	
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
	
	// ----------------------------------- //
	
	
	
	// ---------- Function Help ---------- //
	
	setHelpData(helpData) {
		this.helpData = helpData;
	}
	
	getHelpFor(modName, func) {
		let vars = [];
		
		// We're ordering things in order of specialization:
		//   Specific function variables -> module vars -> trigger vars -> global vars
		// This is likely to be the order of interest for ths user
		let modules = this.helpData.modules || {}; // The || {} is to shut the IDE up
		if (modName in modules) {
			let modData = modules[modName];
			
			let funcID = func.getFuncID();
			if (funcID && modData.functions && (funcID in modData.functions)) {
				vars.push(...modData.functions[funcID]);
			}
			
			if (modData.variables) {
				vars.push(...modData.variables);
			}
		}
		
		let triggers = func.getTriggerTypes();
		triggers.forEach(triggerID => {
			let triggerVars = this.helpData.triggers[triggerID];
			if (triggerVars) {
				vars.push(...triggerVars);
			}
		});
		
		vars.push(...this.helpData.globals);
		
		return vars.join('\n');
	}
}

const mainManager = new MainManager();
export default mainManager;
