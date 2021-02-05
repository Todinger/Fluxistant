import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class DynamicArrayGui extends EntityGui {
	static get GUITYPE()    { return 'DynamicArray';                                                }
	static get BUILDER()    { return (entity, guiID) => new DynamicArrayGui(entity, guiID);   }
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.elementGUIs = [];
		this.elementRows = [];
	}
	
	get isContainer() {
		return true;
	}
	
	_buildElementGUI(element, index) {
		return GuiRegistry.buildGui(
			element,
			`${this.guiID}-${index}`);
	}
	
	_buildElementGUIs() {
		for (let i = 0; i < this.entity.length; i++) {
			let element = this.entity.getElement(i);
			if (!element.isHidden) {
				let elementGui = this._buildElementGUI(element, i);
				this.elementGUIs.push(elementGui);
			}
		}
		
		return this.elementGUIs;
	}
	
	_deleteItem(index) {
		this.entity.removeElementAt(index);
		this.elementGUIs.splice(index, 1);
		this.elementRows[index].remove();
		this.elementRows.splice(index, 1);
	}
	
	_deleteButtonPressed(context) {
		this._deleteItem(context.elementRow.index());
	}
	
	_addButtonPressed() {
		let newIndex = this.entity.length;
		let newElement = this.entity.createAndAddElement();
		let newElementGui = this._buildElementGUI(newElement, newIndex);
		let newElementRow = this._buildElementRow(newElementGui);
		this.elementRows.push(newElementRow);
		
		// See jQueryExtensions.js for the implementation of $.insertAtIndex()
		$.insertAtIndex(
			this.childrenContainer,
			newIndex,
			newElementRow);
	}
	
	_buildElementRow(elementGui) {
		// We want the delete button to delete the item it's
		// on, but for that we need the element row that we
		// create later.
		// We can't create that first, because to create the
		// element row object we need the deletion button
		// ready.
		// So we have the delete button pass an object instead,
		// and we'll fill this object with the element row
		// object after it's created.
		let context = {};
		
		let deleteButton = GuiElements.iconButton({
			icon: 'trash',
			onClick: () => this._deleteButtonPressed(context),
		});
		
		let elementRow = GuiElements.child({
			contents: elementGui.getGUI(),
			post: deleteButton,
		});
		
		context.elementRow = elementRow;
		
		return elementRow;
	}
	
	_buildGUI() {
		// First build the internal GUIs for all the elements in
		// the array
		this._buildElementGUIs();
		
		// Then turn them into child rows which we will nest under
		// a folder afterwards
		this.childrenContainer = $(`<div></div>`)
		for (let i = 0; i < this.elementGUIs.length; i++) {
			this.elementRows[i] = this._buildElementRow(this.elementGUIs[i]);
			this.childrenContainer.append(this.elementRows[i]);
		}
		
		// Before finishing, add the "Add Element" button
		let addButton = $(`<button class="uk-button uk-button-default uk-width-1-1 uk-margin-small-top">Add Element</button>`);
		addButton.click(() => this._addButtonPressed());
		this.childrenContainer.append(addButton);
		
		// Lastly, put all of this into a neat folder that can open all pretty like
		return GuiElements.folder({
			header: this.entity.getName(),
			contents: this.childrenContainer,
			tooltip: this.entity.getDescription(),
		});
	}
	//
	// loadData() {
	// 	this.elementGUIs.forEach(elementGUI => elementGUI.loadData());
	// }
}

GuiRegistry.register(DynamicArrayGui);


/*
class DynamicArrayGui extends FixedArrayGui {
	static get TYPE()       { return DynamicArrayEntity.TYPE;                                        }
	static get BUILDER()    { return (entity, guiID) => new DynamicArrayGui(entity, guiID);    }
	
	constructor(entity, guiID) {
		super(entity, guiID);
	}
	
	_makeAddElementButton() {
	
	}
	
	_buildElementGUIs() {
		let elementGUIs = super._buildElementGUIs();
		let addElementButton = this._makeAddElementButton();
		this._addElementGui(addElementButton);
		elementGUIs.push(addElementButton);
		return elementGUIs;
	}
}

GuiRegistry.register(DynamicArrayGui);
*/
