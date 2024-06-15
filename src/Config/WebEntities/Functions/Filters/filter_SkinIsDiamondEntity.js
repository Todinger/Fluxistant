const FilterEntity = require('./filterEntity');

class Filter_SkinIsDiamondEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsDiamond'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsDiamondEntity(...p); 	}
	
	constructor() {
		super('Diamond Skin');
		this.setDescription('Trigger when a Diamond skin is purchased');
	}
}

module.exports = Filter_SkinIsDiamondEntity;
