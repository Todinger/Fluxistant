const FilterEntity = require('./filterEntity');

class Filter_IsVIPEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_IsVIP'; 							}
	static get BUILDER()	{ return (...p) => new Filter_IsVIPEntity(...p); 	}
	
	constructor() {
		super('VIPs');
		this.setDescription('Allows usage by VIPs');
	}
}

module.exports = Filter_IsVIPEntity;
