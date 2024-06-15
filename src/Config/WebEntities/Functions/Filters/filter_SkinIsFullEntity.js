const FilterEntity = require('./filterEntity');

class Filter_SkinIsFullEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsFull'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsFullEntity(...p); 	}
	
	constructor() {
		super('Full Skin');
		this.setDescription('Trigger when a Full skin is purchased');
	}
}

module.exports = Filter_SkinIsFullEntity;
