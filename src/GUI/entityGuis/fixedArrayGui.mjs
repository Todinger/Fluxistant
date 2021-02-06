import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class FixedArrayGui extends EntityGui {
	static get GUITYPE()    { return 'FixedArray';                                          }
	static get BUILDER()    { return (entity, guiID) => new FixedArrayGui(entity, guiID);   }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.elementGUIs = [];
		this.elementRows = [];
		this.mainGui = null;
	}
	
	get isContainer() {
		return true;
	}
	
	_changed() {
		EntityGui.addChangeIndicator(this.mainGui.guiData.header);
		super._changed();
	}
	
	_onElementChanged(index) {
		EntityGui.addChangeIndicator(this.elementRows[index].guiData.marker);
		this._changed();
	}
	
	_buildElementGUIs() {
		for (let i = 0; i < this.entity.length; i++) {
			let element = this.entity.getElement(i);
			if (!element.isHidden) {
				let elementGui = GuiRegistry.buildGui(
					element,
					`${this.guiID}-${i}`);
				elementGui.onChanged(() => this._onElementChanged(i));
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
			header: this.entity.getName(),
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
