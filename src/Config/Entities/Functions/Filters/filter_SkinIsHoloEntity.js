const FilterEntity = require('./filterEntity');

class Filter_SkinIsHoloEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsHolo'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsHoloEntity(...p); 	}
	
	constructor() {
		super('Holo Skin');
		this.setDescription('Trigger when a Holo skin is purchased');
	}
}

module.exports = Filter_SkinIsHoloEntity;
