const { v4: uuidv4 } = require('uuid');
const EventNotifier = requireMain('eventNotifier');
const CooldownManager = requireMain('./cooldownManager');
const Filter = require('../Filters/functionFilter');
const Errors = requireMain('./errors');
const Globals = requireMain('./globals');
const Utils = requireMain('./utils');

class FunctionTrigger extends EventNotifier {
	constructor(settings) {
		super();
		settings = settings || {};
		this._addEvent('triggered');
		this.triggerID = `Trigger <${uuidv4()}>`;
		this.enabled = settings.enabled !== false;
		this.cooldowns = settings.cooldowns;
		this.filter = this._makeFilter(settings.filters);
		this.paramValues = settings.paramValues || [];
		
		this._active = false;
		this.cooldownID = CooldownManager.addCooldown(this.cooldowns);
	}
	
	get selfUser() {
		return Globals.StreamerUser;
	}

	get hasFilters() {
		return this.filter && !this.filter.isEmpty;
	}

	_makeFilter(filters) {
		if (filters && filters.length > 0) {
			if (filters[0] instanceof Filter) {
				return Globals.functionBuilders.Filters.or({ filters });
			} else {
				return Globals.functionBuilders.combineFilters(filters);
			}
		} else {
			return undefined;
		}
	}
	
	get type() {
		Errors.abstract();
	}
	
	activate() {
		if (this.enabled && !this._active) {
			this._activateImpl();
			this._active = true;
		}
	}
	
	deactivate() {
		if (this._active) {
			CooldownManager.resetCooldowns(this.cooldownID);
			this._deactivateImpl();
			this._active = false;
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
	
	filterTest(context) {
		if (this.filter) {
			return this.filter.test(context);
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
	
	_triggerDefault() {
		this._trigger({ user: this.selfUser });
	}
	
	_trigger(invocationData) {
		if (!CooldownManager.checkCooldowns(this.cooldownID, invocationData.user) ||
			!this.filterTest(invocationData)) {
				return;
		}
		
		CooldownManager.applyCooldowns(this.cooldownID, invocationData.user);
		
		invocationData.triggerVariables = this.variables || [];
		invocationData.params = this._composeParams(invocationData);
		
		this._notify('triggered', invocationData);
	}
}

module.exports = FunctionTrigger;
