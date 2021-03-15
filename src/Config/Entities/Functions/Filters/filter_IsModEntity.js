const FilterEntity = require('./filterEntity');

class Filter_IsModEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_IsMod'; 							}
	static get BUILDER()	{ return (...p) => new Filter_IsModEntity(...p); 	}
	
	constructor() {
		super('Mods');
		this.setDescription('Allows usage by mods');
	}
}

module.exports = Filter_IsModEntity;
