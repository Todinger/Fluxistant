const LogLevel_BaseEntity = require('./logLevel_BaseEntity');

class LogLevel_ErrorEntity extends LogLevel_BaseEntity {
	static get TYPE()		{ return 'LogLevel_Error'; 					}
	static get BUILDER()	{ return () => new LogLevel_ErrorEntity(); 	}
	
	constructor() {
		super('Error');
		this.setDescription('Error messages');
	}
}

module.exports = LogLevel_ErrorEntity;
