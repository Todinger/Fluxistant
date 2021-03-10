import StringGui from "./stringGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class HiddenStringGui extends StringGui {
	static get GUITYPE()    { return 'HiddenString';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new HiddenStringGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
	
	_makeInputField() {
		return $(`<input type="password">`);
	}
}

GuiRegistry.register(HiddenStringGui);
