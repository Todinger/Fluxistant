const FilterEntity = require('./filterEntity');

class Filter_SkinIsEpicEntity extends FilterEntity {
	static get TYPE()		{ return 'Filter_SkinIsEpic'; 							}
	static get BUILDER()	{ return (...p) => new Filter_SkinIsEpicEntity(...p); 	}
	
	constructor() {
		super('Epic Skin');
		this.setDescription('Trigger when an Epic skin is purchased');
	}
}

module.exports = Filter_SkinIsEpicEntity;
