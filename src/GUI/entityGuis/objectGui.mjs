import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class ObjectGui extends EntityGui {
	static get GUITYPE()    { return 'Object';                                          }
	static get BUILDER()    { return (entity, guiID) => new ObjectGui(entity, guiID);   }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.childrenGUIs = {};
	}
	
	get isContainer() {
		return true;
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
	
	_buildChildEntry(childLabeledContainer) {
		return GuiElements.child({
			contents: childLabeledContainer,
		});
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
				childEntry = childrenGUIs[key].getGUI();
			} else {
				childEntry = this._buildChildEntry(
					GuiElements.labeledContainer({
						label: childName,
						contents: childrenGUIs[key].getGUI(),
						tooltip: childDescription,
					})
				);
			}
			
			childrenContainer.append(childEntry);
		});
		
		return childrenContainer;
	}
	
	_buildGUI() {
		let childrenContainer = this._buildChildrenContainer();
		
		return GuiElements.folder({
			header: this.entity.getName(),
			contents: childrenContainer,
			tooltip: this.entity.getDescription(),
		});
		
		
/*
		let objectGui = $(
			`<ul uk-accordion class="uk-margin-small-top">
				<li>
					<a class="uk-accordion-title" href="#">${this.entity.getName()}</a>
					<div class="uk-accordion-content">
					</div>
				</li>
			</ul>`);
		let childrenContainer = objectGui.find('ul > li > div');
		
		this.entity.forEach((key, value) => {
			let childGui = GuiRegistry.buildGui(value.type).makeEditor(
				value,
				`${this.guiID}-${key}`);
			this.childrenGUIs[key] = childGui;
			childrenContainer.push(childGui);
		});
		
		return objectGui;
*/
	}
	
	// loadData() {
	// 	Object.values(this.childrenGUIs).forEach(childGUI => childGUI.loadData());
	// }
	
	// readInput(configEntity, guiID) {
	// 	configEntity.setValue(document.getElementById(`${guiID}-${configEntity.getName()}`).checked);
	// }
}

GuiRegistry.register(ObjectGui);


/*
class ObjectGuiDefiner {
	childID(guiID, key) {
		return `${guiID}-${key}`;
	}
	
	makeEditor(configEntity, guiID) {
		let name = configEntity.getName();
		let description = configEntity.getDescription();
		let childrenGUIs = [];
		configEntity.forEach((key, value) => {
			childrenGUIs.push(
				GuiDefiners.getDefiner(value.type).makeEditor(
					value,
					this.childID(guiID, key)));
		});
		
		let objectGui =
			`<ul uk-accordion class="uk-margin-small-top">
				<li>
					<a class="uk-accordion-title" href="#">${configEntity.getName()}</a>
					<div class="uk-accordion-content">
						${childrenGUIs.join('\n')}
					</div>
				</li>
			</ul>`;
		
		return objectGui;
	}
	
	readInput(configEntity, guiID) {
		configEntity.forEach((key, value) =>
			GuiDefiners.getDefiner(value.type).readInput(
				value,
				this.childID(guiID, key)));
	}
}

let objectGuiDefiner = new ObjectGuiDefiner();
GuiDefiners.register(objectGuiDefiner, StaticObjectEntity.TYPE);
GuiDefiners.register(objectGuiDefiner, DynamicObjectEntity.TYPE);
*/
