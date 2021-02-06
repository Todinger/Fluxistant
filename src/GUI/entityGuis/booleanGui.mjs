import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class BooleanGui extends ValueGui {
	static get GUITYPE()    { return 'Boolean';                                              }
	static get BUILDER()    { return (entity, guiID) => new BooleanGui(entity, guiID); }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_setupInput() {
		this.jInput = $(`<input id="${this.guiID}-input" class="uk-checkbox uk-height-1-1 uk-margin-auto-top" type="checkbox" placeholder="Value...">`);
		this.jInput.prop('checked', !!this.entity.getValue());
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		let _this = this;
		this.jInput.change(function() {
			// NOTE: The "this" here is different from above!
			// It's the checkbox object, not our BooleanGui object.
			_this._guiValueChanged(this.checked);
		});
	}
	
	loadData() {
		if (this.jInput) {
			this.jInput.prop('checked', this.entity.getValue());
		}
	}
}

GuiRegistry.register(BooleanGui);
