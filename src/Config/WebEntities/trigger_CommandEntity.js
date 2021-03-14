const TriggerEntity = require('./triggerEntity');
const EntityFactory = require('../entityFactory');

class Trigger_CommandEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Command'; 					}
	static get BUILDER()	{ return () => new Trigger_CommandEntity(); 	}
	
	constructor(data) {
		super('Command');
		this.setDescription('Activates this function via a command on the Twitch chat');
		this.addString('cmdname', data && data.cmdname || '')
			.setName('Name')
			.setDescription('The term that will invoke the command');
		this.addDynamicArray('aliases', 'String')
			.setDescription('Optional additional names for the command');
		this.addNaturalNumber('cost', data && data.cost || 0)
			.setDescription('Cost in StreamElements loyalty points');
		
		this.setData(data);
		
		this._defineChildrenOrder([
			'active',
			'cmdname',
			'filter',
			'cost',
			'aliases',
			'cooldowns',
			'paramValues',
		]);
	}
	
	setData(data) {
		super.setData(data);
		if (data) {
			if (data.cmdname) {
				this.getChild('cmdname').setValue(data.cmdname);
			}
			
			if (data.aliases) {
				let aliasesArray = this.getChild('aliases');
				data.aliases.forEach(
					alias => aliasesArray.addElement(
						EntityFactory.build('String', alias)));
			}
			
			if (data.cost) {
				this.getChild('cost').setValue(data.cost);
			}
		}
	}
}

module.exports = Trigger_CommandEntity;
