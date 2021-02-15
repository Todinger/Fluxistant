import NumberGui from "./numberGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

// This is what I've found online for allowing only integers, but it doesn't
// seem to work on the current Chrome version.
// I've found another option with keyboard interception, but you can get
// around that using copy/paste.
// At some point I may choose to edit this to make a field that really doesn't
// allow non-integer inputs, but for now I'll just let it show an error when
// the user enters invalid data.
export default class IntegerGui extends NumberGui {
	static get GUITYPE()    { return 'Integer';                                         }
	static get BUILDER()    { return (entity, guiID) => new IntegerGui(entity, guiID);  }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_setupInput() {
		super._setupInput();
		this.jInput.attr('step', '1');
	}
}

GuiRegistry.register(IntegerGui);
