const ChoiceValueEntity = require('./choiceValueEntity');

class LogLevel_ErrorEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'LogLevel_Error'; 					}
	static get BUILDER()	{ return () => new LogLevel_ErrorEntity(); 	}
	
	constructor() {
		super('Error');
		this.setDescription('Error messages');
	}
}

module.exports = LogLevel_ErrorEntity;
