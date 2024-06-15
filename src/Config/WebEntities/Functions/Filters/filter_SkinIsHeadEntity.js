const FilterEntity = require('./filterEntity');

class Filter_SkinIsHeadEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsHead'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsHeadEntity(...p); 	}
	
	constructor() {
		super('Head Skin');
		this.setDescription('Trigger when a Head skin is purchased');
	}
}

module.exports = Filter_SkinIsHeadEntity;
