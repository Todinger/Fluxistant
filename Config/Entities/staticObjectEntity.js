const assert = require('assert').strict;
const ObjectEntity = require('./objectEntity');
const EntityFactory = require('../entityFactory');

class StaticObjectEntity extends ObjectEntity {
	static get TYPE()		{ return 'StaticObject'; 			    			}
	static get BUILDER()	{ return elementType => new StaticObjectEntity(); 	}
	
	constructor(type) {
		super(type || StaticObjectEntity.TYPE);
	}
	
	
	// ---- Overrides ---- //
	
	importDesc(descriptor) {
		Object.keys(descriptor).forEach(key => {
			assert(this.hasChild(key), `Unknown key imported to static object: ${key}`);
			this.getChild(key).import(descriptor[key]);
		});
	}
	
	clone() {
		let copy = EntityFactory.build(this.type);
		Object.keys(this.children).forEach(key => {
			copy.children[key] = this.children[key].clone();
		});
		return copy;
	}
}

module.exports = StaticObjectEntity;
