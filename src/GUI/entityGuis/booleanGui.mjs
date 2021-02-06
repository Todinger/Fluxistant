import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class BooleanGui extends ValueGui {
	static get GUITYPE()    { return 'Boolean';                                              }
	static get BUILDER()    { return (entity, guiID) => new BooleanGui(entity, guiID); }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_guiValueChanged(checked) {
		this.entity.setValue(checked);
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


/*
class BooleanGuiDefiner {
	TYPE = BooleanEntity.TYPE;
	
	makeEditor(configEntity, guiID) {
		let name = configEntity.getName();
		let description = configEntity.getDescription();
		return `<div class="uk-child-width-expand@s uk-grid uk-margin-small-top">
	<h4 class="uk-width-1-6@m" uk-tooltip="${description}">${name}</h4>
	<div class="uk-width-expand@m">
		<input id="${guiID}-${name}" class="uk-checkbox uk-height-1-1 uk-margin-auto-top" type="checkbox" checked="${configEntity.getValue() ? true : false}" placeholder="Value..." uk-tooltip="${description}">
	</div>
</div>`;
	}
	
	readInput(configEntity, guiID) {
		configEntity.setValue(document.getElementById(`${guiID}-${configEntity.getName()}`).checked);
	}
}

GuiDefiners.register(new BooleanGuiDefiner());
*/
