import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class ObjectGui extends EntityGui {
	static get GUITYPE()    { return 'Object';                                                            }
	static get BUILDER()    { return (entity, guiID, modName) => new ObjectGui(entity, guiID, modName);   }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.childrenGUIs = {};
		this.childrenEntries = {};
		this.mainGui = null;
	}
	
	get isContainer() {
		return true;
	}
	
	_contentsChanged() {
		super._changed();
		this._updateStatusIndicators(this.mainGui.guiData.header);
		this.updateName();
	}
	
	_buildChildrenGUIs() {
		this.entity.forEach((key, value) => {
			if (!value.isHidden) {
				this.childrenGUIs[key] = GuiRegistry.buildGui(
					value,
					`${this.guiID}-${key}`,
					this.modName);
			}
		});
		
		return this.childrenGUIs;
	}
	
	_buildChildEntry(childGui, childLabeledContainer) {
		let childEntry = GuiElements.child({
			contents: childLabeledContainer,
		});
		
		childGui.onChangedOrError(() => {
			childGui._updateStatusIndicators(childEntry.guiData.marker);
		});
		
		return childEntry;
	}
	
	_buildChildrenContainer() {
		let childrenContainer = $(`<div></div>`);
		let childrenGUIs = this._buildChildrenGUIs();
		Object.keys(childrenGUIs).forEach(key => {
			let childEntity = this.entity.getChild(key);
			let childDescription = childEntity.getDescription();
			
			let childEntry;
			if (childrenGUIs[key].isContainer) {
				childEntry = this._buildChildEntry(this.childrenGUIs[key], childrenGUIs[key].getGUI());
				
				this.childrenGUIs[key].onChangedOrError(() => {
					this._contentsChanged();
				});
			} else {
				let labeledContainer = GuiElements.labeledContainer({
					label: childEntity.getDisplayName(),
					contents: childrenGUIs[key].getGUI(),
					tooltip: childDescription,
				});
				
				childEntry = this._buildChildEntry(this.childrenGUIs[key], labeledContainer);
				
				this.childrenGUIs[key].onChangedOrError(() => {
					labeledContainer.guiData.label.text(childEntity.getDisplayName());
					this._contentsChanged();
					childrenGUIs[key]._updateStatusIndicators(labeledContainer.guiData.label);
				});
			}
			
			this.childrenEntries[key] = childEntry;
			
			childrenContainer.append(childEntry);
		});
		
		return childrenContainer;
	}
	
	_buildGUI() {
		let childrenContainer = this._buildChildrenContainer();
		
		this.mainGui = GuiElements.folder({
			header: this.entity.getDisplayName(),
			contents: childrenContainer,
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
		Object.keys(this.childrenGUIs).forEach(key => {
			this.childrenGUIs[key].finalizeChanges();
			EntityGui.clearChangeIndicator(this.childrenEntries[key].guiData.marker);
			if (!this.childrenGUIs[key].isContainer) {
				EntityGui.clearChangeIndicator(
					this.childrenEntries[key].guiData.contents.guiData.label);
			}
		});
		
		EntityGui.clearChangeIndicator(this.mainGui.guiData.header);
		
		this.updateName();
	}
	
	updateName() {
		this.mainGui.guiData.header.text(this.entity.getDisplayName());
	}
}

GuiRegistry.register(ObjectGui);