import EventNotifier from "/common/eventNotifier.mjs";

// This is how a EntityGui class should look (override all of these methods)
export default class EntityGui extends EventNotifier {
	// This needs to match the TYPE in the entity whose GUI the definer describes
	static get GUITYPE() { return null; }
	// Concrete classes should have a BUILDER defined similar to this as well:
	// static get BUILDER() { return new EntityGui(); }
	
	constructor(entity, guiID) {
		super();
		this._addEvent('changed');
		
		this.entity = entity;
		this.guiID = guiID;
		this.gui = null;
		this.jPrimaryElement = null;
		this.changedEvent = new Event('changed');
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
	
	// Deriving classes should call this when the entities they're
	// in charge of have their value changed.
	_changed() {
		this._notify('changed');
	}
	
	onChanged(callback) {
		this.on('changed', callback);
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
	}
	
	// Clear the indication that this value has been changed
	clearChangedIndicators() {
	}
	
	// Utility functions for marking changes
	static addChangeIndicator(jElement) {
		jElement.addClass('uk-text-warning');
	}
	
	// Utility functions for unmarking changes
	static clearChangeIndicator(jElement) {
		jElement.removeClass('uk-text-warning');
	}
}
