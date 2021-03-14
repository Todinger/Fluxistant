const assert = require('assert').strict;
const Utils = requireMain('utils');
const Parameter = require('./functionParameter');
const CooldownManager = require('../cooldownManager');

function EMPTY_ACTION() {
	// Do nothing because that's what we do best
}

class Function {
	constructor(settings) {
		this.validateSettings(settings);
		this.name = settings.name;
		this.active = false;
		this.description = settings.description || '';
		this.parameters = settings.parameters || [];
		this.action = settings.action || EMPTY_ACTION;
		this.variables = settings.variables || [];
		this.cooldowns = settings.cooldowns;
		this.triggers = settings.triggers || [];
		this.responses = settings.responses || [];
		this.triggerHandler = (triggerData) => this.invoke(triggerData);
		this._registerTriggers();
		
		this.cooldownID = CooldownManager.addCooldown(this.cooldowns);
		// this.configure(settings);
	}
	
	_makeParameters(parameters) {
		if (parameters) {
			return parameters.map(parameter => new Parameter(parameter));
		} else {
			return [];
		}
	}
	
	configure(settings) {
		this.cooldowns = settings.cooldowns;
		
		this._unregisterTriggers();
		this.triggers = settings.triggers || [];
		this._registerTriggers();
		
		this.responses = settings.responses || [];
	}
	
	activate() {
		if (!this.active) {
			this.triggers.forEach(trigger => trigger.activate());
			this.active = true;
		}
	}
	
	deactivate() {
		if (this.active) {
			this.triggers.forEach(trigger => trigger.deactivate());
			CooldownManager.resetCooldowns(this.cooldownID);
			this.active = false;
		}
	}
	
	validateSettings(settings) {
		if (settings.parameters) {
			// Only the last parameter can "take all" (be filled with all the
			// input values left to be parsed)
			for (let i = 0; i < settings.parameters.length - 1; i++) {
				assert(
					!settings.parameters[i].takeAll,
					'Only the last parameter of a function may be marked as "take all".');
			}
		}
	}
	
	_unregisterTriggers() {
		this.triggers.forEach(trigger =>
			trigger.removeTriggerCallback(this.triggerHandler));
	}
	
	_registerTriggers() {
		this.triggers.forEach(trigger =>
			trigger.onTriggered(this.triggerHandler));
	}
	
	_sendResponses(context) {
		this.responses.forEach(response => response.send(context));
	}
	
	_applyDefaultParamValues(invocationData) {
		for (let i = 0; i < this.parameters.length; i++) {
			if (invocationData.params.length <= i) {
				invocationData.params.push(undefined);
			}
			
			if (!Utils.isNonEmptyString(invocationData.params[i]) &&
				Utils.isNonEmptyString(this.parameters[i].defaultValue)) {
					invocationData.params[i] = this.parameters[i].defaultValue;
			}
		}
	}
	
	_processLastParam(invocationData) {
		if ((this.parameters.length > 0) &&
			(this.parameters[this.parameters.length - 1].takeAll) &&
			(invocationData.params.length > this.parameters.length)) {
				let fullParamValue =
					invocationData.params
						.slice(this.parameters.length - 1)
						.join(' ');
				invocationData.params = invocationData.params.slice(
					0,
					this.parameters.length - 1);
				invocationData.params.push(fullParamValue);
		}
	}
	
	invoke(invocationData) {
		if (!CooldownManager.checkCooldowns(this.cooldownID, invocationData.user)) {
			return;
		}
		
		CooldownManager.applyCooldowns(this.cooldownID, invocationData.user);
		
		invocationData.func = this;
		this._applyDefaultParamValues(invocationData);
		this._processLastParam(invocationData);
		
		let results = this.action(invocationData);
		
		// let parameters = {};
		// results.paramValues = results.paramValues || [];
		// for (let i = 0; i < results.paramValues.length; i++) {
		// 	let filledParameter = _.clone(this.parameters[i]);
		// 	filledParameter.value = results.paramValues[i];
		// 	parameters[this.parameters[i].name] = filledParameter;
		// }
		
		let context = {
			func: this,
			user: invocationData.user,
			variables: invocationData.triggerVariables.concat(this.variables),
			params: {
				in: invocationData.params,
				out: results,
				trigger: invocationData.triggerParams,
			},
		};
		
		this._sendResponses(context);
	}
}

module.exports = Function;
