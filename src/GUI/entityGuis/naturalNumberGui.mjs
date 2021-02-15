import IntegerGui from "./integerGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

// This is what I've found online for allowing only integers that are >= 0,
// but it doesn't seem to work on the current Chrome version.
// I've found another option with keyboard interception, but you can get
// around that using copy/paste.
// At some point I may choose to edit this to make a field that really doesn't
// allow non-natural inputs, but for now I'll just let it show an error when
// the user enters invalid data.
export default class NaturalNumberGui extends IntegerGui {
	static get GUITYPE()    { return 'NaturalNumber';                                         }
	static get BUILDER()    { return (entity, guiID) => new NaturalNumberGui(entity, guiID);  }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_setupInput() {
		super._setupInput();
		this.jInput.attr('min', '0');
	}
}

GuiRegistry.register(NaturalNumberGui);
