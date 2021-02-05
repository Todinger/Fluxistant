import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class FixedArrayGui extends EntityGui {
	static get GUITYPE()    { return 'FixedArray';                                          }
	static get BUILDER()    { return (entity, guiID) => new FixedArrayGui(entity, guiID);   }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.elementGUIs = [];
	}
	
	get isContainer() {
		return true;
	}
	
	_buildElementGUIs() {
		for (let i = 0; i < this.entity.length; i++) {
			let element = this.entity.getElement(i);
			if (!element.isHidden) {
				let elementGui = GuiRegistry.buildGui(
					element,
					`${this.guiID}-${i}`);
				this.elementGUIs.push(elementGui);
			}
		}
		
		return this.elementGUIs;
	}
	
	_buildGUI() {
		// let name = this.entity.getName();
		// let description = this.entity.getDescription();
		//
		// let arrayGui = $(
		// 	`<ul uk-accordion class="uk-margin-small-top">
		// 		<li>
		// 			<a class="uk-accordion-title" href="#">${this.entity.getName()}</a>
		// 			<div class="uk-accordion-content">
		// 			</div>
		// 		</li>
		// 	</ul>`);
		//
		// let childrenContainer = arrayGui.find('ul > li > div');
		
		let childrenContainer = $(`<div></div>`)
		let elementGUIs = this._buildElementGUIs();
		elementGUIs.map(gui => GuiElements.child({ contents: gui.getGUI() })).forEach(childGUI => {
			childrenContainer.append(childGUI);
		});
		
		return GuiElements.folder({
			header: this.entity.getName(),
			contents: childrenContainer,
			tooltip: this.entity.getDescription(),
		});
	}
	
	// loadData() {
	// 	this.elementGUIs.forEach(elementGUI => elementGUI.loadData());
	// }
	
	// readInput(configEntity, guiID) {
	// 	configEntity.setValue(document.getElementById(`${guiID}-${configEntity.getName()}`).checked);
	// }
}

GuiRegistry.register(FixedArrayGui);
