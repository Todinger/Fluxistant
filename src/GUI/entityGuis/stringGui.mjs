import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class StringGui extends ValueGui {
	static get GUITYPE()    { return 'String';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new StringGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.jInput = null;
	}
	
	_makeInputField() {
		return $(`<input type="text">`);
	}
	
	_setupInput() {
		this.jInput = this._makeInputField()
			.attr('class', 'uk-input')
			.val(this.entity.getValue() || '')
			.attr('placeholder', 'Value...');
		//this.jInput = $(`<input id="${this.guiID}-input" class="uk-input" type="text" value="${this.entity.getValue() || ''}" placeholder="Value...">`);
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		this.jInput.change(() => this._guiValueChanged(this.jInput.val()));
		// this.jInput.focusin(() => this.showHelp());
		// this.jInput.focusout(() => this.hideHelp());
	}
}

GuiRegistry.register(StringGui);
