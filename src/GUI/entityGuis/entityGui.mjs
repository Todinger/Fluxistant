import EventNotifier from "/common/eventNotifier.mjs";

// This is how a EntityGui class should look (override all of these methods)
export default class EntityGui extends EventNotifier {
	// This needs to match the TYPE in the entity whose GUI the definer describes
	static get GUITYPE() { return null; }
	// Concrete classes should have a BUILDER defined similar to this as well:
	// static get BUILDER() { return new EntityGui(); }
	
	constructor(entity, guiID, modName) {
		super();
		this._addEvent('changed');
		this._addEvent('error');
		
		this.entity = entity;
		this.guiID = guiID;
		this.modName = modName;
		this.gui = null;
		
		this.changed = false;
		this.error = false;
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
			if (this.entity.isAdvanced) {
				this.gui.addClass('advanced');
			}
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
		this.changed = true;
		
		try {
			this.entity.validate();
			this.error = false;
			this._notify('changed');
		} catch (err) {
			this.error = true;
			this._notify('error', err);
		}
	}
	
	onChanged(callback) {
		this.on('changed', callback);
	}
	
	onError(callback) {
		this.on('error', callback);
	}
	
	onChangedOrError(callback) {
		this.onChanged(callback);
		this.onError(callback);
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		this.changed = false;
	}
	
	_updateStatusIndicators(jElement) {
		EntityGui.updateStatusIndicator(jElement, this.changed, this.error);
	}
	
	static updateStatusIndicator(jElement, changed, error) {
		if (error) {
			EntityGui.addErrorIndicator(jElement);
			EntityGui.clearChangeIndicator(jElement);
		} else if (changed) {
			EntityGui.addChangeIndicator(jElement);
			EntityGui.clearErrorIndicator(jElement);
		} else {
			EntityGui.clearErrorIndicator(jElement);
			EntityGui.clearChangeIndicator(jElement);
		}
	}
	
	// Utility functions for marking changes
	static addChangeIndicator(jElement) {
		jElement.addClass('uk-text-warning');
	}
	
	// Utility functions for unmarking changes
	static clearChangeIndicator(jElement) {
		jElement.removeClass('uk-text-warning');
	}
	
	// Utility functions for marking changes
	static addErrorIndicator(jElement) {
		jElement.addClass('uk-text-danger');
	}
	
	// Utility functions for unmarking changes
	static clearErrorIndicator(jElement) {
		jElement.removeClass('uk-text-danger');
	}
}
