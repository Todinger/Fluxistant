import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class ColorGui extends ValueGui {
	static get GUITYPE()    { return 'Color';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new ColorGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_setupInput() {
		this.jInput = $(`<input id="${this.guiID}-input" class="uk-padding-small uk-margin-auto-top uk-margin-auto-bottom uk-margin-small-left uk-padding-remove uk-width-small" type="color">`);
		this.jInput.val(this.entity.getValue());
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		let _this = this;
		this.jInput.change(function() {
			// NOTE: The "this" here is different from above!
			// It's the input object, not our ColorGui object.
			_this._guiValueChanged(this.value);
		});
	}
	
	loadData() {
		if (this.jInput) {
			this.jInput.val(this.entity.getValue());
		}
	}
	
	refreshContents() {
		this.jInput.val(this.entity.getValue());
	}
}

GuiRegistry.register(ColorGui);
