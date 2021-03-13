const { v4: uuidv4 } = require('uuid');
const EventNotifier = requireMain('eventNotifier');
const Errors = require('../../errors');
const Globals = requireMain('./globals');
const Utils = require('../../utils');

const EMPTY_FILTER = () => true;

class FunctionTrigger extends EventNotifier {
	constructor(settings) {
		super();
		this._addEvent('triggered');
		
		this.triggerID = `Trigger <${uuidv4()}>`;
		this.active = false;
		this.cooldowns = settings.cooldowns;
		this.filter = settings.filter || EMPTY_FILTER;
		this.paramValues = settings.paramValues || [];
	}
	
	get selfUser() {
		return Globals.StreamerUser;
	}
	
	activate() {
		if (!this.active) {
			this._activateImpl();
		}
	}
	
	deactivate() {
		if (this.active) {
			this._deactivateImpl();
		}
	}
	
	_activateImpl() {
		// This should be overridden by concrete triggers to do something
		Errors.abstract();
	}
	
	_deactivateImpl() {
		// This should be overridden by concrete triggers to undo what
		// activate() did
		Errors.abstract();
	}
	
	filterTest() {
		if (this.filter) {
			return this.filter.test();
		} else {
			return true;
		}
	}
	
	onTriggered(callback) {
		this.on('triggered', callback);
	}
	
	removeTriggerCallback(callback) {
		this.removeCallback('triggered', callback);
	}
	
	_composeParams(triggerData) {
		if (!triggerData.params) {
			triggerData.params = [];
		}
		
		let finalParams = [];
		for (let i = 0; i < Math.max(triggerData.params.length, this.paramValues.length); i++) {
			let fixedValue =
				this.paramValues.length > i ?
					this.paramValues[i] :
					undefined;
			let userValue =
				triggerData.params.length > i ?
					triggerData.params[i] :
					undefined;
			
			if (Utils.isNonEmptyString(fixedValue)) {
				finalParams.push(fixedValue);
			} else  {
				finalParams.push(userValue);
			}
		}
		
		return finalParams;
	}
	
	_trigger(triggerData) {
		triggerData.triggerVariables = this.variables || [];
		triggerData.params = this._composeParams(triggerData);
		
		this._notify('triggered', triggerData);
	}
}

module.exports = FunctionTrigger;
