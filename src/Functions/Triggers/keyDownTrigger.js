const Trigger = require('./functionTrigger');
const KeyboardManager = requireMain('./keyboardManager');

class KeyDownTrigger extends Trigger {
	constructor(settings) {
		super(settings);
		this.keyDownHandler = () => this._handleKeyDown();
	}
	
	get type() {
		return "keyDown";
	}
	
	_handleKeyDown() {
		this._triggerDefault();
	}
	
	_activateImpl() {
		KeyboardManager.onKeyDown(this.keyDownHandler);
	}
	
	_deactivateImpl() {
		KeyboardManager.removeKeyDownHandler(this.keyDownHandler);
	}
}

module.exports = KeyDownTrigger;
