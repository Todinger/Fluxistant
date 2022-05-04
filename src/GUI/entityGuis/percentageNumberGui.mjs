import IntegerGui from "./integerGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class PercentageNumberGui extends IntegerGui {
	static get GUITYPE()    { return 'PercentageNumber';                                                           }
	static get BUILDER()    { return (entity, guiID, modName) => new PercentageNumberGui(entity, guiID, modName);  }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_setupInput() {
		super._setupInput();
		this.jInput.attr('min', '0');
		this.jInput.attr('max', '100');
	}
}

GuiRegistry.register(PercentageNumberGui);
