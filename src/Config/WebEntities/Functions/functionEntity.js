const StaticObjectEntity = require('../staticObjectEntity');
const FilterChoiceEntity = require('./Filters/filterChoiceEntity');
const TriggerChoiceEntity = require('./Triggers/triggerChoiceEntity');
const ResponseChoiceEntity = require('./Responses/responseChoiceEntity');

class FunctionEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Function'; 							}
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
		this.addDynamicArray('responses', 'ResponseChoice')
			.setName('Responses')
			.setDescription('Defines messages that will be sent after the function is done');
		
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
		}
	}
	
	addObject(object, childName, objectClass, data) {
		let choiceEntity = this.getChild(childName).addElement(new objectClass());
		let selectedObject = choiceEntity.select(object.type);
		selectedObject.setData(data || object);
	}
	
	addFilter(filter) {
		// let filterChoiceEntity = this.getChild('filters').addElement(new FilterChoiceEntity());
		// let selectedTrigger = filterChoiceEntity.select(filter.type);
		// selectedTrigger.setData(filter);
		this.addObject(filter, 'filters', FilterChoiceEntity);
	}
	
	addTrigger(trigger) {
		// let triggerChoiceEntity = this.getChild('triggers').addElement(new TriggerChoiceEntity());
		// let selectedTrigger = triggerChoiceEntity.select(trigger.type);
		// selectedTrigger.setData(trigger);
		this.addObject(trigger, 'triggers', TriggerChoiceEntity);
	}
	
	addResponse(data, response) {
		// let responseChoiceEntity = this.getChild('responses').addElement(new ResponseChoiceEntity());
		// let selectedResponse = responseChoiceEntity.select(response.type);
		// selectedResponse.setData(response);
		let responseData = {
			response,
			helpText: data.getAllVariables().map(variable => variable.toMarkdown()).join('\n'),
		}
		this.addObject(response, 'responses', ResponseChoiceEntity, responseData);
	}
	
	// ---- Overrides ---- //
	
	getDisplayName() {
		let displayName = this.getName();
		if (!displayName) {
			displayName = this.getChild('name').getValue();
		}
		
		return displayName || super.getDisplayName();
	}
}

module.exports = FunctionEntity;
