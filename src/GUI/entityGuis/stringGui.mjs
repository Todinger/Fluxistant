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
			.val(this.entity.getValue() || '');
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		this.jInput.change(() => this._guiValueChanged(this.jInput.val()));
	}
}

GuiRegistry.register(StringGui);
