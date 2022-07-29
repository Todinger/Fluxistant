const TriggerEntity = require('./triggerEntity');
const EntityFactory = require('../../../entityFactory');

class Trigger_CliEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Cli'; 					}
	static get BUILDER()	{ return () => new Trigger_CliEntity(); 	}
	
	constructor(data) {
		super('CLI');
		this.setDescription('Activates this function via a command on the bot command line');
		this.addString('cmdname', data && data.cmdname || '')
			.setName('Name')
			.setDescription('The term that will invoke the command on the CLI');
		
		this.setData(data);
	}
	
	setData(data) {
		super.setData(data);
		if (data) {
			if (data.cmdname) {
				this.getChild('cmdname').setValue(data.cmdname);
			}
		}
	}
}

module.exports = Trigger_CliEntity;
