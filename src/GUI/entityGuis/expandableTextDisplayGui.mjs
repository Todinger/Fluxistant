import TextDisplayGui from "./textDisplayGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class ExpandableTextDisplayGui extends TextDisplayGui {
	static get GUITYPE()    { return 'ExpandableTextDisplay';                      }
	static get BUILDER()    { return (...p) => new ExpandableTextDisplayGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.mainGui = null;
	}
	
	get isContainer() {
		return true;
	}
	
	_buildGUI() {
		let textDisplay = super._buildGUI();
		this.mainGui = GuiElements.folder({
			header: this.entity.getDisplayName(),
			contents: textDisplay,
		});
		
		return this.mainGui;
	}
}

GuiRegistry.register(ExpandableTextDisplayGui);
