import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import FocusManager from "../focusManager.mjs";

export default class CustomChoiceGui extends EntityGui {
	static get GUITYPE()    { return 'CustomChoice';                      }
	static get BUILDER()    { return (...p) => new CustomChoiceGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_buildOptions() {
		this.selector.empty();
		
		this.entity.forEach(option => {
			let selectorOption = $(`<option value="${option}">${option}</option>`);
			this.selector.append(selectorOption);
		});
		
		// Set initial selection
		if (this.entity.hasSelection()) {
			selector[0].selectedIndex = this.entity.getSelectedIndex();
		}
	}
	
	_buildGUI() {
		let selector = $(`<select id="${this.guiID}" class="uk-select"></select>`);
		this.selector = selector;
		
		this._buildOptions();
		
		selector.change(() => {
			this.entity.select(selector[0].selectedIndex);
			this._changed();
		});
		
		// Announce when we get focus
		selector.focusin(() => FocusManager.obtainedMainFocus());
		
		return selector;
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
		this._buildOptions();
	}
}

GuiRegistry.register(CustomChoiceGui);
