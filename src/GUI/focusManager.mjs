class FocusManagerClass {
	constructor() {
		this.currentlyFocusedGui = null;
	}
	
	obtainedMainFocus(entityGui) {
		if (this.currentlyFocusedGui !== entityGui) {
			if (this.currentlyFocusedGui) {
				this.currentlyFocusedGui.lostFocus();
			}
			
			if (entityGui) {
				entityGui.gotFocus();
			}
		}
		
		this.currentlyFocusedGui = entityGui;
	}
}

const FocusManager = new FocusManagerClass();
export default FocusManager;
