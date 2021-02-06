import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class NumberGui extends ValueGui {
	static get GUITYPE()    { return 'Number';                                              }
	static get BUILDER()    { return (entity, guiID) => new NumberGui(entity, guiID); }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_setupInput() {
		this.jInput = $(`<input id="${this.guiID}-input" class="uk-input" type="number" value="${this.entity.getValue() || ''}" placeholder="Value...">`);
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		this.jInput.change(() => {
			let newValue = this.jInput.val();
			if (newValue && newValue !== '') {
				this._guiValueChanged(Number(newValue));
			}
		});
	}
}

GuiRegistry.register(NumberGui);
