import EntityGui from "./entityGui.mjs";

export default class ValueGui extends EntityGui {
	static get GUITYPE()    { return null; }   // Abstract class, should not be instantiated
	
	constructor(entity, guiID) {
		super(entity, guiID);
		this.jInput = null;
	}
	
	// This should create our this.jInput variable and set it up to detect and react to changes
	_setupInput() {
		throw 'Abstract method invoked.';
	}
	
	_guiValueChanged(newValue) {
		this.entity.setValue(newValue);
		this._changed();
	}
	
	_buildGUI() {
		this._setupInput();
		return this.jInput;
	}
	
	// Visually marks that this value has been changed
	activateChangedIndicators() {
		EntityGui.addChangeIndicator(this.jInput);
	}
	
	// Clear the indication that this value has been changed
	clearChangedIndicators() {
		EntityGui.clearChangeIndicator(this.jInput);
	}
}
