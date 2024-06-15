const ChoiceValueEntity = require('../../choiceValueEntity');
const FilterChoiceEntity = require('../Filters/filterChoiceEntity');
const EntityFactory = require('../../../entityFactory');

class TriggerEntity extends ChoiceValueEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	
	constructor(displayText, data) {
		super(displayText);
		this.addBoolean('enabled', true)
			.setName('Enabled')
			.setDescription('Enables/disables this trigger');
		this.addCooldowns('cooldowns')
			.setDescription('Function-wide cooldowns (work in addition to function-wide cooldowns)')
			.setAdvanced();
		this.addDynamicArray('filters', 'FilterChoice', undefined, data && data.allowedFilters)
			.setName('Filters')
			.setDescription('Specifies when and by whom this trigger can be activated')
			.setAdvanced();
		this.addDynamicArray('paramValues', 'String')
			.setName('Function Parameter Values')
			.setDescription('Values to give to the function as parameters (simulates what you would get from a command with arguments)')
			.setAdvanced();
		
		this.setData(data);
	}
	
	addFilter(filter) {
		let filterChoiceEntity = this.getChild('filters').addElement(new FilterChoiceEntity());
		let selectedTrigger = filterChoiceEntity.select(filter.type);
		selectedTrigger.setData(filter);
	}

	alwaysShowFilters() {
		this.getChild('filters').setSimple();
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
			
			if (data.filter) {
				data.filter.getSubFilters().forEach(filter => this.addFilter(filter));
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
