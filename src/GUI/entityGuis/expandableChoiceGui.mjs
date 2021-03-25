import ChoiceGui from "./choiceGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";
import EntityGui from "./entityGui.mjs";

export default class ExpandableChoiceGui extends ChoiceGui {
	static get GUITYPE()    { return 'ExpandableChoice';                      }
	static get BUILDER()    { return (...p) => new ExpandableChoiceGui(...p); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.mainGui = null;
	}
	
	get isContainer() {
		return true;
	}
	
	_changed() {
		super._changed();
		this._updateName();
	}
	
	_buildGUI() {
		let contents = super._buildGUI();
		
		this.mainGui = GuiElements.folder({
			header: this.entity.getDisplayName(),
			contents: contents,
			tooltip: this.entity.getDescription(),
		});
		
		return this.mainGui;
	}
	
	// Add an indication that this value has been changed (note: not its children)
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.mainGui.guiData.header);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		EntityGui.clearChangeIndicator(this.mainGui.guiData.header);
		this._updateName();
	}
	
	_updateName() {
		this.mainGui.guiData.header.text(this.entity.getDisplayName());
	}
}

GuiRegistry.register(ExpandableChoiceGui);
