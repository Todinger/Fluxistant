import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class NumberGui extends ValueGui {
	static get GUITYPE()    { return 'Number';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new NumberGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_setupInput() {
		this.jInput = $(`<input id="${this.guiID}-input" class="uk-input" type="number" value="${this.entity.getValue() || ''}">`);
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		this.jInput.change(() => {
			let newValueString = this.jInput.val();
			let newValue = undefined;
			if (newValueString !== '') {
				newValue = Number(newValueString);
			}
			
			this._guiValueChanged(newValue);
		});
	}
}

GuiRegistry.register(NumberGui);
