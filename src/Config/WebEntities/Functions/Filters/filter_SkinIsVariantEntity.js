const FilterEntity = require('./filterEntity');

class Filter_SkinIsVariantEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsVariant'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsVariantEntity(...p); 	}
	
	constructor() {
		super('Variant Skin');
		this.setDescription('Trigger when a Variant (Gold or Diamond) skin is purchased');
	}
}

module.exports = Filter_SkinIsVariantEntity;
