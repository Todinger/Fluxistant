const assert = require('assert').strict;
// const Utils = requireMain('./utils');

class EntityFactory {
	constructor() {
		this.builders = {};
		this.entityClasses = {};
	}
	
	// registerAll(entitiesPath) {
	// 	entitiesPath = entitiesPath || ENTITIES_DIR;
	// 	let entityFiles = Utils.getFilePaths(entitiesPath);
	// 	entityFiles = entityFiles.filter(filename => filename.endsWith(ENTITY_SUFFIX));
	// 	entityFiles.forEach(filename => {
	// 		let entityClass = require(filename);
	// 		let type = entityClass.TYPE;
	// 		if (type) {
	// 			assert(!(type in this.entityClasses), `Duplicate entity type: ${type}`);
	// 			this.entityClasses[type] = entityClass;
	// 			this.register(type, entityClass.BUILDER);
	//
	// 			console.log(`[EntityFactory] Registered type ${type} from ${filename}.`);
	// 		}
	// 	});
	// }
	
	processEntityClass(entityClass, filePath) {
		let type = entityClass.TYPE;
		if (type) {
			assert(!(type in this.entityClasses), `Duplicate entity type: ${type}`);
			this.entityClasses[type] = entityClass;
			this.register(type, entityClass.BUILDER);
			
			// console.log(`[EntityFactory] Registered type ${type} from ${filePath}.`);
		}
	}
	
	register(type, builder) {
		assert(!(type in this.builders), `Duplicate entity type: ${type}.`);
		this.builders[type] = builder;
	}
	
	build(type, ...params) {
		assert(type in this.builders, `Unknown entity type: ${type}`);
		return this.builders[type].apply(null, params);
	}
}

module.exports = new EntityFactory();
