const ChoiceValueEntity = require('./choiceValueEntity');

class logLevel_DebugEntity extends ChoiceValueEntity {
	static get TYPE()		{ return 'LogLevel_Debug'; 					}
	static get BUILDER()	{ return () => new logLevel_DebugEntity(); 	}
	
	constructor() {
		super('Debug');
		this.setDescription('Information meant for debugging purposes only (you only need to use this if Flux asked you to)');
	}
}

module.exports = logLevel_DebugEntity;
