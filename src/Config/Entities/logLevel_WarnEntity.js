const ChoiceValueEntity = require('./choiceValueEntity');

class logLevel_WarnEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'LogLevel_Warn'; 					}
	static get BUILDER()	{ return () => new logLevel_WarnEntity(); 	}
	
	constructor() {
		super('Warn');
		this.setDescription('Warning messages');
	}
}

module.exports = logLevel_WarnEntity;
