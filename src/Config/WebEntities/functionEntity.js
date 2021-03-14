const StaticObjectEntity = require('./staticObjectEntity');
const TriggerChoiceEntity = require('./triggerChoiceEntity');
const ResponseChoiceEntity = require('./responseChoiceEntity');

class FunctionEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Function'; 							}
	// static get GUITYPE()	{ return 'Function'; 							}
	static get BUILDER()	{ return (...p) => new FunctionEntity(...p); 	}
	
	constructor(data) {
		super();
		// this.addString('name', data && data.name)
		// 	.setName('Name')
		// 	.setDescription("A name for you to recognize this function easily (it has no meaning other than organization for you");
		this.addBoolean('active', !!(data && data.active))
			.setName('Enabled')
			.setDescription('Enables/disables this function');
		this.addCooldowns('cooldowns')
			.setDescription('Function-wide cooldowns (work in addition to trigger-specific cooldowns)')
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
			
			if (data.triggers) {
				data.triggers.forEach(trigger => this.addTrigger(trigger));
			}
			
			if (data.responses) {
				data.responses.forEach(response => this.addResponse(response));
			}
		}
	}
	
	addTrigger(trigger) {
		let triggerChoiceEntity = this.getChild('triggers').addElement(new TriggerChoiceEntity());
		let selectedTrigger = triggerChoiceEntity.select(trigger.type);
		selectedTrigger.setData(trigger);
	}
	
	addResponse(response) {
		let responseChoiceEntity = this.getChild('responses').addElement(new ResponseChoiceEntity());
		let selectedResponse = responseChoiceEntity.select(response.type);
		selectedResponse.setData(response);
	}
}

module.exports = FunctionEntity;
