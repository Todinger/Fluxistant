import NaturalNumberGui from "./naturalNumberGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

// This is what I've found online for allowing only integers that are >= 0
//  and <= 365, but it doesn't seem to work on the current Chrome version.
// I've found another option with keyboard interception, but you can get
// around that using copy/paste.
// At some point I may choose to edit this to make a field that really doesn't
// allow non-natural inputs, but for now I'll just let it show an error when
// the user enters invalid data.
export default class DegreesGui extends NaturalNumberGui {
	static get GUITYPE()    { return 'Degrees';                                                           }
	static get BUILDER()    { return (entity, guiID, modName) => new DegreesGui(entity, guiID, modName);  }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_setupInput() {
		super._setupInput();
		this.jInput.attr('max', '365');
	}
}

GuiRegistry.register(DegreesGui);
