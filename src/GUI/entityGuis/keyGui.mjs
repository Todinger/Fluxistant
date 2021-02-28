import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class KeyGui extends EntityGui {
	static get GUITYPE()    { return 'Key';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new KeyGui(entity, guiID, modName); }
	
	static stopActiveListener() {
		if (KeyGui.activeListener) {
			KeyGui.activeListener.stopListeningForKey();
			KeyGui.activeListener = null;
		}
	}
	
	static processKey(event) {
		if (KeyGui.activeListener) {
			let htmlCode = Enums.withNumLock(event.code, event.originalEvent.getModifierState("NumLock"));
			KeyGui.activeListener.setKey(htmlCode);
			event.preventDefault();
		}
	}
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		
		this.containerButton = null;
		this.switcher = null;
		this.keyLabel = null;
	}
	
	_valueChanged() {
		this._changed();
		this._updateStatusIndicators(this.keyLabel);
	}
	
	listenForKey() {
		KeyGui.stopActiveListener();
		KeyGui.activeListener = this;
		this.showKeypressPrompt();
	}
	
	setKey(keyCode) {
		if (this.entity.getKey() !== keyCode) {
			this.entity.setKey(keyCode);
			this.keyLabel.text(this.entity.getKeyName());
			this.stopListeningForKey();
			this._valueChanged();
		}
	}
	
	showClickPrompt() {
		UIkit.switcher(this.switcher).show(0);
	}
	
	showKeypressPrompt() {
		UIkit.switcher(this.switcher).show(1);
	}
	
	showKeyValue() {
		UIkit.switcher(this.switcher).show(2);
	}
	
	showInactiveState() {
		if (this.entity.getValue()) {
			this.showKeyValue();
		} else {
			this.showClickPrompt();
		}
	}
	
	stopListeningForKey() {
		this.showInactiveState();
		KeyGui.activeListener = null;
	}
	
	_buildGUI() {
		let button = $(`<div class="uk-button uk-button-default""></div>`);
		let switcher = $(`<ul uk-switcher="toggle: > *" hidden></ul>`);
		for (let i = 0; i <= 2; i++) {
			switcher.append($(`<li></li>`));
		}
		
		let states = $(`<ul class="uk-switcher" uk-switcher="toggle: > *"></ul>`);
		states.append($(`<li>Click to Set Key</li>`));
		states.append($(`<li>Waiting for keypress...</li>`));
		let keyLabel = $(`<li class="uk-label">${this.entity.getKeyName()}</li>`);
		states.append(keyLabel);
		
		button.append(switcher, states);
		
		button.click(() => this.listenForKey());
		button.on('remove', () => KeyGui.stopActiveListener());
		
		this.containerButton = button;
		this.switcher = switcher;
		this.keyLabel = keyLabel;
		
		setTimeout(() => this.showInactiveState(), 100);
		
		return this.containerButton;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.keyLabel);
	}
	
	// Clear the indication that this value has been changed
	clearChangedIndicators() {
		EntityGui.clearChangeIndicator(this.keyLabel);
	}
	
	
	/*
	<div class="uk-child-width-expand uk-grid uk-margin-small-top uk-flex-nowrap" uk-tooltip="Key">
		<h3 class="uk-width-1-6 uk-text-warning">Key</h3>
		<div class="uk-width-expand">
		
			<div class="uk-button uk-button-default" onclick="listenForKey();">
				<ul id="keyview" uk-switcher="toggle: > *" hidden>
					<li></li>
					<li></li>
					<li></li>
				</ul>
				<ul id="keyview-vals" class="uk-switcher" uk-switcher="toggle: > *">
					<li>Click to Set Key</li>
					<li>Waiting for keypress...</li>
					<li id="keyText" class="uk-label">F1</li>
				</ul>
			</div>
			
		</div>
	</div>
	*/
	
}

KeyGui.activeListener = null;

$(document).keydown(function(event) {
	KeyGui.processKey(event);
});

GuiRegistry.register(KeyGui);
