const FilterEntity = require('./filterEntity');

class Filter_SkinIsGoldEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsGold'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsGoldEntity(...p); 	}
	
	constructor() {
		super('Gold Skin');
		this.setDescription('Trigger when a Gold skin is purchased');
	}
}

module.exports = Filter_SkinIsGoldEntity;
