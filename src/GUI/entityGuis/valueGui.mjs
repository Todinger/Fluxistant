import EntityGui from "./entityGui.mjs";

export default class ValueGui extends EntityGui {
	static get GUITYPE()    { return null; }   // Abstract class, should not be instantiated
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.jInput = null;
	}
	
	// This should create our this.jInput variable and set it up to detect and react to changes
	_setupInput() {
		throw 'Abstract method invoked.';
	}
	
	_guiValueChanged(checked) {
		this.entity.setValue(checked);
	}
	
	_buildGUI() {
		this._setupInput();
		return this.jInput;
		
		// return GuiElements.labeledContainer({
		// 	label: this.entity.getName(),
		// 	contents: this.jInput,
		// 	tooltip: this.entity.getDescription(),
		// });
		
		//
		// let outerContainer = $(`<div class="uk-child-width-expand uk-grid uk-margin-small-top uk-flex-nowrap"></div>`);
		// if (name && name !== '') {
		// 	outerContainer.append($(`<h4 class="uk-width-1-6" uk-tooltip="${description}">${name}</h4>`));
		// }
		// let innerContainer = $(`<div class="uk-width-expand"></div>`);
		//
		// innerContainer.append(this.jInput);
		// outerContainer.append(innerContainer);
		//
		// return outerContainer;
	}
	
	loadData() {
		if (this.jInput) {
			this.jInput.val(this.entity.getValue());
		}
	}
}
