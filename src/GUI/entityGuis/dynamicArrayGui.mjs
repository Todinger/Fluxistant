import EntityGui from "./entityGui.mjs";
import GuiRegistry from "./guiRegistry.mjs";
import GuiElements from "./guiElements/guiElements.mjs";

export default class DynamicArrayGui extends EntityGui {
	static get GUITYPE()    { return 'DynamicArray';                                                          }
	static get BUILDER()    { return (entity, guiID, modName) => new DynamicArrayGui(entity, guiID, modName); }
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.elementGUIs = [];
		this.elementRows = [];
		this.mainGui = null;
		
		this._addEvent('elementAdded');
	}
	
	get isContainer() {
		return true;
	}
	
	_changed() {
		super._changed();
		this._updateStatusIndicators(this.mainGui.guiData.header);
	}
	
	_buildElementGUI(element, index) {
		return GuiRegistry.buildGui(
			element,
			`${this.guiID}-${index}`,
			this.modName);
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
		this._changed();
	}
	
	_addButtonPressed() {
		let newIndex = this.entity.length;
		let newElement = this.entity.createAndAddElement();
		let newElementGui = this._buildElementGUI(newElement, newIndex);
		this.elementGUIs.push(newElementGui);
		let newElementRow = this._buildElementRow(newElementGui);
		this.elementRows.push(newElementRow);
		
		// See jQueryExtensions.js for the implementation of $.insertAtIndex()
		$.insertAtIndex(
			this.childrenContainer,
			newIndex,
			newElementRow);
		
		this._changed();
		newElementGui.activateChangedIndicators();
		this._notify('elementAdded', newElementGui);
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
		elementGui.onChangedOrError(() => {
			this._changed();
		});
		
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
		
		// Before finishing, add the "Add" button for new elements
		let addButton = $(`<button class="uk-button uk-button-default uk-width-1-1 uk-margin-small-top">Add</button>`);
		addButton.click(() => this._addButtonPressed());
		this.childrenContainer.append(addButton);
		
		// Lastly, put all of this into a neat folder that can open all pretty like
		this.mainGui = GuiElements.folder({
			header: this.entity.getDisplayName(),
			contents: this.childrenContainer,
			tooltip: this.entity.getDescription(),
		});
		
		this.mainGui.attr('id', this.guiID);
		
		return this.mainGui;
	}
	
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.mainGui.guiData.header);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		super.finalizeChanges();
		for (let i = 0; i < this.entity.length; i++) {
			this.elementGUIs[i].finalizeChanges();
		}
		
		EntityGui.clearChangeIndicator(this.mainGui.guiData.header);
	}
	
	refreshContents() {
		this.elementGUIs.forEach(gui => gui.refreshContents());
	}
}

GuiRegistry.register(DynamicArrayGui);
