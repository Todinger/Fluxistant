import EntityGui from "./entityGui.mjs";

export default class ValueGui extends EntityGui {
	static get GUITYPE()    { return null; }   // Abstract class, should not be instantiated
	
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
		this.jInput = null;
	}
	
	// This should create our this.jInput variable and set it up to detect and react to changes
	_setupInput() {
		throw 'Abstract method invoked.';
	}
	
	_guiValueChanged(newValue) {
		this.entity.setValue(newValue);
		this._changed();
		this._updateStatusIndicators(this.jInput);
	}
	
	_buildGUI() {
		this._setupInput();
		return this.jInput;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.jInput);
	}
	
	// Accept changes and remove change markers
	finalizeChanges() {
		EntityGui.clearChangeIndicator(this.jInput);
	}
}
