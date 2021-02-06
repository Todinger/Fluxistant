import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class ObjectGui extends EntityGui {
	static get GUITYPE()    { return 'Object';                                          }
	static get BUILDER()    { return (entity, guiID) => new ObjectGui(entity, guiID);   }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.childrenGUIs = {};
		this.childrenEntries = {};
		this.mainGui = null;
	}
	
	get isContainer() {
		return true;
	}
	
	_contentsChanged() {
		EntityGui.addChangeIndicator(this.mainGui.guiData.header);
		super._changed();
	}
	
	_buildChildrenGUIs() {
		this.entity.forEach((key, value) => {
			if (!value.isHidden) {
				this.childrenGUIs[key] = GuiRegistry.buildGui(
					value,
					`${this.guiID}-${key}`);
			}
		});
		
		return this.childrenGUIs;
	}
	
	_buildChildEntry(childGui, childLabeledContainer) {
		let childEntry = GuiElements.child({
			contents: childLabeledContainer,
		});
		
		childGui.onChanged(() => EntityGui.addChangeIndicator(childEntry.guiData.marker));
		
		return childEntry;
	}
	
	_buildChildrenContainer() {
		let childrenContainer = $(`<div></div>`);
		let childrenGUIs = this._buildChildrenGUIs();
		Object.keys(childrenGUIs).forEach(key => {
			let childEntity = this.entity.getChild(key);
			let childName = childEntity.getName();
			let childDescription = childEntity.getDescription();
			
			let childEntry;
			if (childrenGUIs[key].isContainer) {
				childEntry = this._buildChildEntry(this.childrenGUIs[key], childrenGUIs[key].getGUI());
				
				this.childrenGUIs[key].onChanged(() => {
					this._contentsChanged();
				});
			} else {
				let labeledContainer = GuiElements.labeledContainer({
					label: childName,
					contents: childrenGUIs[key].getGUI(),
					tooltip: childDescription,
				});
				
				childEntry = this._buildChildEntry(this.childrenGUIs[key], labeledContainer);
				
				this.childrenGUIs[key].onChanged(() => {
					EntityGui.addChangeIndicator(labeledContainer.guiData.label);
					this._contentsChanged();
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
			header: this.entity.getName(),
			contents: childrenContainer,
			tooltip: this.entity.getDescription(),
		});
		
		return this.mainGui;
	}
	
	// Clear the indication that this value has been changed
	clearChangedIndicators() {
		Object.keys(this.childrenGUIs).forEach(key => {
			this.childrenGUIs[key].clearChangedIndicators();
			EntityGui.clearChangeIndicator(this.childrenEntries[key].guiData.marker);
			if (!this.childrenGUIs[key].isContainer) {
				EntityGui.clearChangeIndicator(
					this.childrenEntries[key].guiData.contents.guiData.label);
			}
		});
		
		EntityGui.clearChangeIndicator(this.mainGui.guiData.header);
	}
}

GuiRegistry.register(ObjectGui);
