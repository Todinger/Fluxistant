import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class FixedArrayGui extends EntityGui {
	static get GUITYPE()    { return 'FixedArray';                                                            }
	static get BUILDER()    { return (entity, guiID, modName) => new FixedArrayGui(entity, guiID, modName);   }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.elementGUIs = [];
		this.elementRows = [];
		this.mainGui = null;
	}
	
	get isContainer() {
		return true;
	}
	
	_changed() {
		super._changed();
		this._updateStatusIndicators(this.mainGui.guiData.header);
	}
	
	_onElementChanged(index) {
		this._changed();
		this.elementGUIs[index]._updateStatusIndicators(this.elementRows[index].guiData.marker);
	}
	
	_buildElementGUIs() {
		for (let i = 0; i < this.entity.length; i++) {
			let element = this.entity.getElement(i);
			if (!element.isHidden) {
				let elementGui = GuiRegistry.buildGui(
					element,
					`${this.guiID}-${i}`,
					this.modName);
				elementGui.onChanged(() => this._onElementChanged(i));
				elementGui.onError(() => this._onElementChanged(i));
				this.elementGUIs.push(elementGui);
			}
		}
		
		return this.elementGUIs;
	}
	
	_buildGUI() {
		let childrenContainer = $(`<div></div>`)
		let elementGUIs = this._buildElementGUIs();
		elementGUIs.map(gui => GuiElements.child({ contents: gui.getGUI() })).forEach(elementRow => {
			this.elementRows.push(elementRow);
			childrenContainer.append(elementRow);
		});
		
		this.mainGui = GuiElements.folder({
			header: this.entity.getDisplayName(),
			contents: childrenContainer,
			tooltip: this.entity.getDescription(),
		});
		
		return this.mainGui;
	}
	
	// Clear the indication that this value has been changed
	clearChangedIndicators() {
		for (let i = 0; i < this.entity.length; i++) {
			EntityGui.clearChangeIndicator(this.elementRows[i].guiData.marker);
			this.elementGUIs[i].clearChangedIndicators();
		}
		
		EntityGui.clearChangeIndicator(this.mainGui.guiData.header);
	}
}

GuiRegistry.register(FixedArrayGui);
