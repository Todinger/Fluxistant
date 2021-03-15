const Trigger = require('./functionTrigger');
const KeyboardManager = requireMain('./keyboardManager');

class KeyUpTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.keyUpHandler = () => this._handleKeyUp();
	}
	
	get type() {
		return "keyUp";
	}
	
	_handleKeyUp() {
		this._triggerDefault();
	}
	
	_activateImpl() {
		KeyboardManager.onKeyUp(this.keyUpHandler);
	}
	
	_deactivateImpl() {
		KeyboardManager.removeKeyUpHandler(this.keyUpHandler);
	}
}

module.exports = KeyUpTrigger;
