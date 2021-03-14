const { v4: uuidv4 } = require('uuid');
const EventNotifier = requireMain('eventNotifier');
const CooldownManager = requireMain('./cooldownManager');
const Errors = requireMain('./errors');
const Globals = requireMain('./globals');
const Utils = requireMain('./utils');

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
		
		this.cooldownID = CooldownManager.addCooldown(this.cooldowns);
	}
	
	get selfUser() {
		return Globals.StreamerUser;
	}
	
	get type() {
		Errors.abstract();
	}
	
	activate() {
		if (!this.active) {
			this._activateImpl();
		}
	}
	
	deactivate() {
		if (this.active) {
			CooldownManager.resetCooldowns(this.cooldownID);
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
	
	_trigger(invocationData) {
		if (!CooldownManager.checkCooldowns(this.cooldownID, invocationData.user)) {
			return;
		}
		
		CooldownManager.applyCooldowns(this.cooldownID, invocationData.user);
		
		invocationData.triggerVariables = this.variables || [];
		invocationData.params = this._composeParams(invocationData);
		
		this._notify('triggered', invocationData);
	}
}

module.exports = FunctionTrigger;
