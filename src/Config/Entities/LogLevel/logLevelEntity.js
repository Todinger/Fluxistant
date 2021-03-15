const ChoiceEntity = require('../choiceEntity');

class LogLevelEntity extends ChoiceEntity {
	static get TYPE()		{ return 'LogLevel'; 					}
	static get BUILDER()	{ return () => new LogLevelEntity(); 	}
	
	constructor() {
		super();
		this._addOptions({
			["error"]:	'LogLevel_Error',
			["warn"]:	'LogLevel_Warn',
			["info"]:	'LogLevel_Info',
			["debug"]:	'LogLevel_Debug',
		});
		
		this.select('info');
	}
}

module.exports = LogLevelEntity;
