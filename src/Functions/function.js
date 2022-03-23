const assert = require('assert').strict;
const Utils = requireMain('utils');
const Parameter = require('./functionParameter');
const CooldownManager = require('../cooldownManager');
const Trigger = require('./Triggers/functionTrigger');
const Response = require('./Responses/functionResponse');
const Filter = require('./Filters/functionFilter');
const Builders = require('./builders');
const GlobalVariables = require('./globalVariables');

function EMPTY_ACTION() {
	// Do nothing because that's what we do best
}

class Function {
	constructor(settings, module) {
		this.validateSettings(settings);
		this.module = module;
		this.funcID = settings.funcID;
		this.name = settings.name;
		this.enabled = settings.enabled !== false;
		this.description = settings.description || '';
		this.parameters = this._makeParameters(settings.parameters);
		this.action = settings.action || EMPTY_ACTION;
		this.filter = this._makeFilter(settings.filters);
		this.variables = [].concat(settings.variables || []).concat(module.variables || []);
		this.cooldowns = settings.cooldowns;
		this.triggers = this._makeTriggers(settings.triggers);
		this.responses = this._makeResponses(settings.responses);
		this.responseDelay = settings.responseDelay || 0;
		this.triggerHandler = (triggerData) => this.invoke(triggerData);
		this._registerTriggers();
		
		this._active = false;
		this.cooldownID = CooldownManager.addCooldown(this.cooldowns);
	}
	
	_makeParameters(parameters) {
		if (parameters) {
			return parameters.map(parameter => new Parameter(parameter));
		} else {
			return [];
		}
	}
	
	_makeObjects(buildersCollection, objectsData) {
		let objects = [];
		if (objectsData) {
			objectsData.forEach(objectData => {
				let object = buildersCollection[objectData.type](objectData);
				objects.push(object);
			});
		}
		
		return objects;
	}
	
	_makeFilter(filtersData) {
		if (filtersData && filtersData.length > 0) {
			if (filtersData[0] instanceof Filter) {
				return Builders.Filters.or({filters: filtersData})
			} else {
				return Builders.combineFilters(filtersData);
			}
		} else {
			return Builders.Filters.or();
		}
	}
	
	_makeTriggers(triggersData) {
		if (triggersData && triggersData.length > 0) {
			if (triggersData[0] instanceof Trigger) {
				return triggersData;
			} else {
				return this._makeObjects(Builders.Triggers, triggersData);
			}
		} else {
			return [];
		}
	}
	
	_makeResponses(responsesData) {
		if (responsesData && responsesData.length > 0) {
			if (responsesData[0] instanceof Response) {
				return responsesData;
			} else {
				return this._makeObjects(Builders.Responses, responsesData);
			}
		} else {
			return [];
		}
	}
	
	getAllVariables() {
		let vars = [...this.variables];
		vars.push(...GlobalVariables);
		if (this.triggers && this.triggers.length > 0) {
			vars.push(...this.triggers
				.map(trigger => trigger.variables || [])
				.reduce((arrSoFar, current) =>
					arrSoFar.concat(current)));
		}
		
		return vars;
	}
	
	configure(settings) {
		this.enabled = settings.enabled;
		
		this.filter = this._makeFilter(settings.filters);
		
		CooldownManager.changeCooldown(this.cooldownID, settings.cooldowns);
		this.cooldowns = settings.cooldowns;
		
		this._unregisterTriggers();
		this.triggers = this._makeTriggers(settings.triggers);
		this._registerTriggers();
		
		this.responses = this._makeResponses(settings.responses);
	}
	
	activate() {
		if (this.enabled && !this._active) {
			this.triggers.forEach(trigger => trigger.activate());
			this._active = true;
		}
	}
	
	deactivate() {
		if (this._active) {
			this.triggers.forEach(trigger => trigger.deactivate());
			CooldownManager.resetCooldowns(this.cooldownID);
			this._active = false;
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
		if (this.responseDelay > 0 && this.responses.length > 0) {
			this.responses[0].send(context);
			for (let i = 1; i < this.responses.length; i++) {
				setTimeout(() => this.responses[i].send(context), i * this.responseDelay);
			}
		} else {
			this.responses.forEach(response => response.send(context));
		}
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
	
	// If the input parameters are all undefined (a side-effect of
	// _applyDefaultParamValues when there are no set or default values),
	// resets it to an empty array
	_cleanPrams(invocationData) {
		for (let i = 0; i < invocationData.params.length; i++) {
			if (invocationData.params[i] !== undefined) {
				return;
			}
		}
		
		invocationData.params = [];
	}
	
	invoke(invocationData) {
		if (!this._active ||
			!CooldownManager.checkCooldowns(this.cooldownID, invocationData.user) ||
			!this.filter.test(invocationData)) {
				return;
		}
		
		CooldownManager.applyCooldowns(this.cooldownID, invocationData.user);
		
		invocationData.func = this;
		this._applyDefaultParamValues(invocationData);
		this._processLastParam(invocationData);
		this._cleanPrams(invocationData);
		invocationData.getParam = (index) => {
			if (invocationData.params.length > index) {
				return invocationData.params[index];
			} else {
				return undefined;
			}
		};
		
		invocationData.firstParam = invocationData.getParam(0);
		
		let results = this.action(invocationData);
		
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
