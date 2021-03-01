const ObjectEntity = require('./objectEntity');
const EntityFactory = require('../entityFactory');

class StaticObjectEntity extends ObjectEntity {
	static get TYPE()		{ return 'StaticObject';	    			}
	static get BUILDER()	{ return () => new StaticObjectEntity(); 	}
	
	// ---- Overrides ---- //
	
	importDesc(descriptor) {
		Object.keys(descriptor).forEach(key => {
			// Only import children we know
			if (this.hasChild(key)) {
				this.getChild(key).import(descriptor[key]);
			}
		});
	}
	
	cloneImpl() {
		let copy = EntityFactory.build(this.type);
		Object.keys(this.children).forEach(key => {
			copy.children[key] = this.children[key].clone();
		});
		return copy;
	}
}

module.exports = StaticObjectEntity;
