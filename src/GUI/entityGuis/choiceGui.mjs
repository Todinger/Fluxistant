import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class ChoiceGui extends EntityGui {
	static get GUITYPE()    { return 'Choice';                                        }
	static get BUILDER()    { return (entity, guiID) => new ChoiceGui(entity, guiID); }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.optionGUIs = {};
		this.optionIndices = {};
	}
	
	_buildOptionGUIs() {
		this.entity.forEach((optionName, optionEntity) => {
			this.optionGUIs[optionName] = GuiRegistry.buildGui(
				optionEntity,
				`${this.guiID}-option-${optionName}`);
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
	
	_buildGUI() {
		/*
				<select class="uk-select" onchange="UIkit.switcher($('#hey')).show(Number(this.value));">
					<option value="0">Mods Only</option>
					<option value="1">Mods and Above</option>
					<option value="2">Specific Users</option>
				</select>
				<ul id="hey" uk-switcher="toggle: > *" hidden>
					<li></li>
					<li></li>
					<li></li>
				</ul>
				<ul id="bla" class="uk-switcher">
					<li>First</li>
					<li>Second</li>
					<li>Third</li>
				</ul>
		 */
		
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
			let selectedOption = this.value;
			UIkit.switcher(switcher).show(_this.optionIndices[selectedOption]);
			let selection = _this.entity.select(selectedOption);
			_this._setDescriptionTooltip(selector, selection.getDescription());
		});
		
		let initialSelection = this.entity.getSelection();
		if (initialSelection) {
			this._setDescriptionTooltip(selector, initialSelection.getDescription());
		}
		
		// Set initial selection
		selector.val(this.entity.selectedOption);
		
		// Changing the switcher doesn't seem to work when we haven't yet attached
		// these elements to the page, so for the initial selection we do this with
		// a tiny delay to make sure it's done after loading is finished
		setTimeout(
			() => UIkit.switcher(switcher).show(this.optionIndices[this.entity.selectedOption]),
			10);
		
		container.append(selector);
		container.append(switcher);
		container.append(optionsContainer);
		return container;
	}
	
	// loadData() {
	// 	this.elementGUIs.forEach(elementGUI => elementGUI.loadData());
	// }
	
	// readInput(configEntity, guiID) {
	// 	configEntity.setValue(document.getElementById(`${guiID}-${configEntity.getName()}`).checked);
	// }
}

GuiRegistry.register(ChoiceGui);

