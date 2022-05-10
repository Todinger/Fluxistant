const FilterEntity = require('./filterEntity');

class Filter_IsBroadcasterEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_IsBroadcaster'; 							}
	static get BUILDER()	{ return (...p) => new Filter_IsBroadcasterEntity(...p); 	}
	
	constructor() {
		super('Broadcaster');
		this.setDescription('Allows usage by the broadcaster');
	}
}

module.exports = Filter_IsBroadcasterEntity;
