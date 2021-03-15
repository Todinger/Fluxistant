const LogLevel_BaseEntity = require('./logLevel_BaseEntity');

class logLevel_WarnEntity extends LogLevel_BaseEntity {
	static get TYPE()		{ return 'LogLevel_Warn'; 					}
	static get BUILDER()	{ return () => new logLevel_WarnEntity(); 	}
	
	constructor() {
		super('Warn');
		this.setDescription('Warning messages');
	}
}

module.exports = logLevel_WarnEntity;
