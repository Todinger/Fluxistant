import DataGui from "./dataGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";

export default class SingleDataGui extends DataGui {
	static get GUITYPE()    { return 'Data';                                                                }
	static get BUILDER()    { return (entity, guiID, modName) => new SingleDataGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
}

GuiRegistry.register(SingleDataGui);
