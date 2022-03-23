const _ = require('lodash');
const StaticObjectEntity = require('../staticObjectEntity');
const FilterChoiceEntity = require('./Filters/filterChoiceEntity');
const TriggerChoiceEntity = require('./Triggers/triggerChoiceEntity');
const ResponseChoiceEntity = require('./Responses/responseChoiceEntity');

class FunctionEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Function'; 							}
	static get GUITYPE()	{ return 'Function'; 							}
	static get BUILDER()	{ return (...p) => new FunctionEntity(...p); 	}
	
	constructor(data) {
		super();
		this.addString('funcID', data && data.funcID)
			.hide();
		this.addString('name', data && data.name)
			.setName('Name')
			.setDescription("A name for you to recognize this function easily (it has no meaning other than organization for you)")
			.hide();
		this.addBoolean('enabled', (data && data.enabled) !== false)
			.setName('Enabled')
			.setDescription('Enables/disables this function');
		this.addDuration('responseDelay', (data && data.responseDelay) || 0)
			.setName('Response Delay')
			.setDescription('Sets a delay between each two responses sent')
			.setAdvanced();
		this.addCooldowns('cooldowns')
			.setDescription('Function-wide cooldowns (work in addition to trigger-specific cooldowns)')
			.setAdvanced();
		this.addDynamicArray('filters', 'FilterChoice')
			.setName('Filters')
			.setDescription('Defines who can invoke this function')
			.setAdvanced();
		this.addDynamicArray('triggers', 'TriggerChoice')
			.setName('Triggers')
			.setDescription('Defines when this function will be invoked');
		// console.log(`Function Self: ${this.dbg} / Triggers: ${this.getChild('triggers').dbg}`);
		
		this.addDynamicArray('responses', 'ResponseChoice')
			.setName('Responses')
			.setDescription('Defines messages that will be sent after the function is done');
		this.addDynamicArray('failResponses', 'ResponseChoice')
			.setName('Failure Responses')
			.setDescription('Defines messages that will be sent if the function fails');
		
		if (data) {
			if (data.name) {
				this.setName(data.name);
			}
			
			if (data.cooldowns) {
				this.getChild('cooldowns').set(data.cooldowns);
			}
			
			if (data.filter) {
				data.filter.getSubFilters().forEach(filter => this.addFilter(filter));
			}
			
			if (data.triggers) {
				data.triggers.forEach(trigger => this.addTrigger(trigger));
			}
			
			if (data.responses) {
				data.responses.forEach(response => this.addResponse(data, response));
			}
			
			if (data.failResponses) {
				data.failResponses.forEach(response => this.addFailResponse(data, response));
			}
		}
		
		// Events (these initializations are to make the IDE treat the
		// variables as functions properly without giving warnings about types)
		this.eOnTriggersChanged = (x) => x;
		this.eTriggersChanged = (x) => x;
		this.eOnTriggersChangedRemove = (x) => x;
		[
			this.eOnTriggersChanged,
			this.eTriggersChanged,
			this.eOnTriggersChangedRemove
		] = this.event('triggersChanged');
		
		this._listenForTriggerChanges();
	}
	
	_listenForTriggerChanges() {
		// Notify trigger changes, as these can directly change
		// help data for responses
		this.getChild('triggers').eOnChanged(() => this.eTriggersChanged());
	}
	
	getFuncID() {
		return this.getChild('funcID').getValue();
	}
	
	addObject(object, childName, objectClass) {
		let choiceEntity = this.getChild(childName).addElement(new objectClass());
		let selectedObject = choiceEntity.select(object.type);
		selectedObject.setData(object);
	}
	
	addFilter(filter) {
		this.addObject(filter, 'filters', FilterChoiceEntity);
	}
	
	addTrigger(trigger) {
		this.addObject(trigger, 'triggers', TriggerChoiceEntity);
	}
	
	addResponse(data, response) {
		this.addObject(response, 'responses', ResponseChoiceEntity);
	}
	
	addFailResponse(data, response) {
		this.addObject(response, 'failResponses', ResponseChoiceEntity);
	}
	
	getTriggerTypes() {
		return _.uniq(this
			.getChild('triggers')
			.getElements()
			.map(triggerChoice => triggerChoice.selectedOption));
	}
	
	// ---- Overrides ---- //
	
	getDisplayName() {
		let displayName = this.getName();
		if (!displayName) {
			displayName = this.getChild('name').getValue();
		}
		
		return displayName || super.getDisplayName();
	}
	
	cloneImpl() {
		let clone = super.cloneImpl();
		// clone.triggers = clone.getChild('triggers');
		clone._listenForTriggerChanges();
		return clone;
	}
}

module.exports = FunctionEntity;
