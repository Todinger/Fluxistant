// This is how a EntityGui class should look (override all of these methods)
export default class EntityGui {
	// This needs to match the TYPE in the entity whose GUI the definer describes
	static get GUITYPE() { return null; }
	// Concrete classes should have a BUILDER defined similar to this as well:
	// static get BUILDER() { return new EntityGui(); }
	
	constructor(entity, guiID) {
		this.entity = entity;
		this.guiID = guiID;
		this.gui = null;
	}
	
	get isContainer() {
		return false;
	}
	
	// Returns the GUI element for editing the entity.
	// If it hasn't been created yet, this builds it first.
	getGUI() {
		if (!this.gui) {
			this.gui = this._buildGUI();
			this.gui.attr('id', this.guiID);
		}
		
		return this.gui;
	}
	
	// Creates and returns the GUI element for editing the entity
	_buildGUI() {
		throw 'Abstract function called.';
	}
	
	// Loads data from the entity to the GUI
	loadData() {
		throw 'Abstract function called.';
	}
}
