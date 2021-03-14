const LogLevel_BaseEntity = require('./logLevel_BaseEntity');

class LogLevel_InfoEntity extends LogLevel_BaseEntity {
	static get TYPE()		{ return 'LogLevel_Info'; 					}
	static get BUILDER()	{ return () => new LogLevel_InfoEntity(); 	}
	
	constructor() {
		super('Info');
		this.setDescription('General informative entries (not errors)');
	}
}

module.exports = LogLevel_InfoEntity;
