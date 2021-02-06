import ValueGui from "./valueGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class StringGui extends ValueGui {
	static get GUITYPE()    { return 'String';                                              }
	static get BUILDER()    { return (entity, guiID) => new StringGui(entity, guiID); }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.jInput = null;
	}
	
	_setupInput() {
		this.jInput = $(`<input id="${this.guiID}-input" class="uk-input" type="text" value="${this.entity.getValue() || ''}" placeholder="Value...">`);
		let description = this.entity.getDescription();
		if (description && description !== '') {
			this.jInput.attr('uk-tooltip', description);
		}
		
		this.jInput.change(() => this._guiValueChanged(this.jInput.val()));
	}
	
	// readInput(configEntity, guiID) {
	// 	configEntity.setValue($(`#${guiID}-${configEntity.getName()}`).val());
	// }
}

GuiRegistry.register(StringGui);


/*
class StringGuiDefiner {
	TYPE = StringEntity.TYPE;
	
	makeEditor(configEntity, guiID) {
		let name = configEntity.getName();
		let description = configEntity.getDescription();
		return `<div class="uk-child-width-expand@s uk-grid uk-margin-small-top">
	<h4 class="uk-width-1-6@m" uk-tooltip="${description}">${name}</h4>
	<div class="uk-width-expand@m">
		<input id="${guiID}-${name}" class="uk-input" type="text" value="${configEntity.getValue() || ''}" placeholder="Value..." uk-tooltip="${description}">
	</div>
</div>`;
	}
	
	readInput(configEntity, guiID) {
		configEntity.setValue($(`#${guiID}-${configEntity.getName()}`).val());
	}
}

GuiDefiners.register(new StringGuiDefiner());
*/
