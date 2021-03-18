import EntityGui from "./entityGui.mjs";
import RawObjectGui from "./rawObjectGui.mjs";
import FocusManager from "../focusManager.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import MainManager from "../mainManager.mjs";

export default class ChannelRewardGui extends EntityGui {
	static get GUITYPE()    { return 'ChannelReward';                      }
	static get BUILDER()    { return (...p) => new ChannelRewardGui(...p); }
	
	static stopActiveListener() {
		if (ChannelRewardGui.activeListener) {
			ChannelRewardGui.activeListener.stopListeningForReward();
			ChannelRewardGui.activeListener = null;
		}
	}
	
	static processKey(event) {
		if (ChannelRewardGui.activeListener) {
			if (event.key === 'Escape') {
				ChannelRewardGui.activeListener.stopListeningForReward();
			}
		}
	}
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		
		this.listening = false;
		
		this.container = null;
		this.switcher = null;
		this.listenButton = null;
		this.contentsGui = null;
	}
	
	_toggleButtonState() {
		if (this.listening) {
			MainManager.stopListeningForReward();
		} else {
			this.listenForReward();
		}
	}
	
	listenForReward() {
		ChannelRewardGui.stopActiveListener();
		ChannelRewardGui.activeListener = this;
		this.showRewardListeningState();
		FocusManager.obtainedMainFocus(this);
		this.listening = true;
		MainManager.listenForReward(this);
	}
	
	showClickPrompt() {
		this.listenButton.text('Listen for Reward Redemption');
		UIkit.switcher(this.switcher).show(0);
	}
	
	showRewardListeningState() {
		this.listenButton.text('Listening for reward...');
		UIkit.switcher(this.switcher).show(0);
	}
	
	showContents() {
		UIkit.switcher(this.switcher).show(1);
	}
	
	rewardRedeemed(rewardID) {
		this.entity.setRewardID(rewardID);
		this.contentsGui.refreshContents();
		this._changed();
		this.contentsGui.getChildGui('rewardID').activateChangedIndicators();
		this.showContents();
		ChannelRewardGui.activeListener = null;
	}
	
	stopListeningForReward() {
		this.showClickPrompt();
		ChannelRewardGui.activeListener = null;
		this.listening = false;
	}
	
	_buildGUI() {
		this.container = $(`<div></div>`);
		this.switcher = $(`<ul uk-switcher="toggle: > *" hidden></ul>`);
		for (let i = 0; i < 2; i++) {
			this.switcher.append($(`<li></li>`));
		}
		
		let states = $(`<ul class="uk-switcher" uk-switcher="toggle: > *"></ul>`);
		
		this.listenButton = $(`<li class="uk-button uk-button-default uk-width-expand"></li>`);
		this.listenButton.click(() => this._toggleButtonState());
		this.listenButton.on('remove', () => ChannelRewardGui.stopActiveListener());
		states.append(this.listenButton);
		
		this.contentsGui = new RawObjectGui(this.entity, `${this.guiID}.contents`, this.modName);
		this.contentsGui.onChangedOrError(() => this._changed());
		let contentsState = this.contentsGui.getGUI();
		
		states.append($(`<li></li>`).append(contentsState));
		this.container.append(this.switcher, states);
		
		if (this.entity.getRewardID()) {
			setTimeout(() => this.showContents(), 100);
		} else {
			setTimeout(() => this.showClickPrompt(), 100);
		}
		
		return this.container;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		this.contentsGui.activateChangedIndicators();
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		this.contentsGui.finalizeChanges();
	}
}

ChannelRewardGui.activeListener = null;

$(document).keydown(function(event) {
	ChannelRewardGui.processKey(event);
});

GuiRegistry.register(ChannelRewardGui);
