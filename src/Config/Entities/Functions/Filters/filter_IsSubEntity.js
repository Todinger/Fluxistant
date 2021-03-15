const FilterEntity = require('./filterEntity');

class Filter_IsSubEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_IsSub'; 							}
	static get BUILDER()	{ return (...p) => new Filter_IsSubEntity(...p); 	}
	
	constructor() {
		super('Subs');
		this.setDescription('Allows usage by subs');
	}
}

module.exports = Filter_IsSubEntity;
