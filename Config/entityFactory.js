const assert = require('assert').strict;
const path = require('path');
const Utils = requireMain('./utils');

const ENTITIES_DIR = './Entities';
const ENTITY_SUFFIX = 'Entity.js';

class EntityFactory {
	constructor() {
		this.builders = {};
		this.entityClasses = {};
	}
	
	registerAll(entitiesPath) {
		entitiesPath = entitiesPath || ENTITIES_DIR;
		let entityFiles = Utils.getFilePaths(entitiesPath);
		entityFiles = entityFiles.filter(filename => filename.endsWith(ENTITY_SUFFIX));
		entityFiles.forEach(filename => {
			console.log(`[EntityFactory] Processing file: ${filename}`);
			let entityClass = require(filename);
			if (entityClass.TYPE) {
				let type = entityClass.TYPE;
				// assert(!(type in this.entityClasses), `Duplicate entity type: ${type}`);
				this.entityClasses[type] = entityClass;
				this.register(type, entityClass.BUILDER);
			}
		});
	}
	
	register(type, builder) {
		assert(!(type in this.builders), `Duplicate entity type: ${type}.`);
		this.builders[type] = builder;
		console.log(`[EntityFactory] Registered type: ${type}`);
	}
	
	build(type, ...params) {
		assert(type in this.builders, `Unknown entity type: ${type}`);
		return this.builders[type].apply(null, params);
	}
}

module.exports = new EntityFactory();
