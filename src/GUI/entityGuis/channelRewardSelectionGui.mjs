import EntityGui from "./entityGui.mjs";
import FocusManager from "../focusManager.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import MainManager from "../mainManager.mjs";

export default class ChannelRewardSelectionGui extends EntityGui {
	static get GUITYPE()    { return 'ChannelRewardSelection';                      }
	static get BUILDER()    { return (...p) => new ChannelRewardSelectionGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.selector = null;
	}
	
	_changed() {
		super._changed();
		this.activateChangedIndicators();
	}
	
	_buildOptions(rewardsList) {
		this.selector.empty();
		let selectionPresent = false;
		rewardsList.forEach(reward => {
			let option = $(`<option value="${reward.rewardID}">${reward.rewardName}</option>`);
			this.selector.append(option);
			if (this.entity.getValue() === reward.rewardName) {
				selectionPresent = true;
			}
		});
		
		if (selectionPresent) {
			this.selector.val(this.entity.getValue());
		} else {
			this.entity.clearValue();
		}
	}
	
	_buildGUI() {
		this.selector = $(`<select class="uk-select"></select>`);
		if (this.entity.getDescription()) {
			this.selector.attr('uk-tooltip', this.entity.getDescription());
		}
		
		this._buildOptions(MainManager.getRewardsList());
		
		// Announce when we get focus
		this.selector.focusin(() => FocusManager.obtainedMainFocus());
		let _this = this;
		this.selector.change(function() {
			_this.entity.setValue(this.value);
			_this._changed();
		});
		
		// Register to know when our saved channel rewards have changed
		// so that we can update our own contents accordingly
		MainManager.onRewardsChanged((rewardsList) => this._buildOptions(rewardsList));
		
		return this.selector;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.selector);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		EntityGui.clearChangeIndicator(this.selector);
	}
	
	refreshContents() {
		super.refreshContents();
		this.selector.val(this.entity.getValue());
	}
}

GuiRegistry.register(ChannelRewardSelectionGui);