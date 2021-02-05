const ConfigEntity = require('./configEntity');
const ObjectEntity = require('./objectEntity');
const EntityFactory = require('../entityFactory');

class DynamicObjectEntity extends ObjectEntity {
	static get TYPE()		{ return 'DynamicObject'; 		   			}
	static get GUITYPE()	{ return 'DynamicObject'; 		   			}
	static get BUILDER()	{ return () => new DynamicObjectEntity(); 	}
	
	constructor(type) {
		super(type || DynamicObjectEntity.TYPE);
	}
	
	
	// ---- Overrides ---- //
	
	importDesc(descriptor) {
		Object.keys(descriptor).forEach(key => {
			let child = ConfigEntity.readEntity(descriptor[key]);
			if (this.hasChild(key)) {
				this.setChild(key, child);
			} else {
				this.addChild(key, child);
			}
		});
	}
	
	cloneImpl() {
		let copy = EntityFactory.build(this.type);
		Object.keys(this.children).forEach(key => {
			copy.addChild(key, this.children[key].clone());
		});
		return copy;
	}
}

module.exports = DynamicObjectEntity;
