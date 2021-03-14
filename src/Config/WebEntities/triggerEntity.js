const ChoiceValueEntity = require('./choiceValueEntity');
const EntityFactory = require('../entityFactory');

class TriggerEntity extends ChoiceValueEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText, data) {
		super(displayText);
		this.addBoolean('enabled', true)
			.setName('Enabled')
			.setDescription('Enables/disables this trigger');
		this.addString('filter')
			.setDescription('Specifies when and by whom this trigger can be activated')
			.setAdvanced();
		this.addCooldowns('cooldowns')
			.setDescription('Function-wide cooldowns (work in addition to function-wide cooldowns)')
			.setAdvanced();
		this.addDynamicArray('paramValues', 'String')
			.setName('Parameter Values')
			.setDescription('Values to give to the function as parameters (simulates what you would get from a command with arguments)')
			.setAdvanced();
		
		this.setData(data);
	}
	
	setData(data) {
		if (data) {
			if (data.name) {
				this.setName(data.name);
			}
			
			if (data.enabled !== undefined) {
				this.getChild('enabled').setValue(data.enabled);
			}
			
			if (data.description) {
				this.setDescription(data.description);
			}
			
			if (data.cooldowns) {
				this.getChild('cooldowns').set(data.cooldowns);
			}
			
			if (data.paramValues) {
				let array = this.getChild('paramValues');
				data.paramValues.forEach(value => {
					array.addElement(EntityFactory.build('String', value));
				});
			}
		}
	}
}

module.exports = TriggerEntity;
