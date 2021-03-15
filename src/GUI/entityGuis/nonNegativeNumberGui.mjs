import IntegerGui from "./integerGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

// This is identical to NaturalNumberGui right now, but at some
// point I might change these to only allow whole/positive numbers,
// so might as well separate them now
export default class NonNegativeNumberGui extends IntegerGui {
	static get GUITYPE()    { return 'NonNegativeNumber';                                                           }
	static get BUILDER()    { return (entity, guiID, modName) => new NonNegativeNumberGui(entity, guiID, modName);  }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_setupInput() {
		super._setupInput();
		this.jInput.attr('min', '0');
	}
}

GuiRegistry.register(NonNegativeNumberGui);
