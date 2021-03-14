const ChoiceValueEntity = require('./choiceValueEntity');

class LogLevel_InfoEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'LogLevel_Info'; 					}
	static get BUILDER()	{ return () => new LogLevel_InfoEntity(); 	}
	
	constructor() {
		super('Info');
		this.setDescription('General informative entries (not errors)');
	}
}

module.exports = LogLevel_InfoEntity;
