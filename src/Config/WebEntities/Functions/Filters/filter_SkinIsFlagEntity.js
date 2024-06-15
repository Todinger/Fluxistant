const FilterEntity = require('./filterEntity');

class Filter_SkinIsFlagEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsFlag'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsFlagEntity(...p); 	}
	
	constructor() {
		super('Flag Skin');
		this.setDescription('Trigger when a Flag skin is purchased');
	}
}

module.exports = Filter_SkinIsFlagEntity;
