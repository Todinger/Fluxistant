const ObjectEntity = require('./objectEntity');

class SimpleObjectEntity extends ObjectEntity {
	static get TYPE()		{ return 'SimpleObject'; 					}
	static get BUILDER()	{ return () => new SimpleObjectEntity(); 	}
	
	constructor() {
		super(SimpleObjectEntity.TYPE);
	}
}

module.exports = SimpleObjectEntity;
