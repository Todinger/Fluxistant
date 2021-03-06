const DynamicObjectEntity = require('./dynamicObjectEntity');

class SimpleObjectEntity extends DynamicObjectEntity {
	static get TYPE()		{ return 'SimpleObject'; 					}
	static get BUILDER()	{ return () => new SimpleObjectEntity(); 	}
	
	constructor() {
		super();
	}
}

module.exports = SimpleObjectEntity;
