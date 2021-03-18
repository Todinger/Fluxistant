import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import FocusManager from "../focusManager.mjs";

export default class ChoiceGui extends EntityGui {
	static get GUITYPE()    { return 'Choice';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new ChoiceGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.optionGUIs = {};
		this.optionIndices = {};
	}
	
	_buildOptionGUIs() {
		this.entity.forEach((optionName, optionEntity) => {
			this.optionGUIs[optionName] = GuiRegistry.buildGui(
				optionEntity,
				`${this.guiID}-option-${optionName}`,
				this.modName);
			this.optionGUIs[optionName].onChangedOrError(() => this._changed());
		});
		
		return this.optionGUIs;
	}
	
	_setDescriptionTooltip(selector, description) {
		if (description && description !== '') {
			selector.attr('uk-tooltip', description);
		} else {
			selector.removeAttr('uk-tooltip');
		}
	}
	
	switchTo(selectedOption) {
		UIkit.switcher(this.switcher).show(this.optionIndices[selectedOption]);
		let selection = this.entity.select(selectedOption);
		this._setDescriptionTooltip(this.selector, selection.getDescription());
		this._changed();
	}
	
	_buildGUI() {
		let container = $(`<div id="${this.guiID}"></div>`);
		
		let optionGUIs = this._buildOptionGUIs();
		
		let selector = $(`<select class="uk-select"></select>`);
		let switcher = $(`<ul id="${this.guiID}-switcher" uk-switcher="toggle: > *" hidden></ul>`);
		let optionsContainer = $(`<ul class="uk-switcher"></ul>`);
		
		let index = 0;
		Object.keys(optionGUIs).forEach(optionName => {
			this.optionIndices[optionName] = index;
			
			let selectorOption =
				$(`<option value="${optionName}">${this.entity.getOption(optionName).getDisplayText()}</option>`);
			selector.append(selectorOption);
			
			switcher.append($(`<li></li>`));
			
			let optionItem = $(`<li></li>`);
			optionItem.append(optionGUIs[optionName].getGUI());
			optionsContainer.append(optionItem);
			
			index++;
		});
		
		let _this = this;
		selector.change(function() {
			_this.switchTo(this.value);
		});
		
		let initialSelection = this.entity.getSelection();
		if (initialSelection) {
			this._setDescriptionTooltip(selector, initialSelection.getDescription());
		}
		
		// Set initial selection
		selector.val(this.entity.selectedOption);
		
		// Announce when we get focus
		selector.focusin(() => FocusManager.obtainedMainFocus());
		
		// Changing the switcher doesn't seem to work when we haven't yet attached
		// these elements to the page, so for the initial selection we do this with
		// a tiny delay to make sure it's done after loading is finished
		setTimeout(
			() => UIkit.switcher(switcher).show(this.optionIndices[this.entity.selectedOption]),
			10);
		
		this.switcher = switcher;
		this.selector = selector;
		
		container.append(selector);
		container.append(switcher);
		container.append(optionsContainer);
		return container;
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		Object.values(this.optionGUIs).forEach(gui => gui.finalizeChanges());
	}
	
	refreshContents() {
		Object.values(this.optionGUIs).forEach(gui => gui.refreshContents());
		this.switchTo(this.entity.selectedOption);
	}
}

GuiRegistry.register(ChoiceGui);

