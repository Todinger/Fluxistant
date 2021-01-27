const assert = require('assert').strict;
const Errors = require('../../errors');
const EntityFactory = require('../entityFactory');

class ConfigEntity {
	static get TYPE() { return null; }	// Avoid construction (abstract type)
	
	constructor(type) {
		this.type = type;
		this.description = null;
		this.name = null;
	}
	
	setName(name) {
		this.name = name;
		return this;
	}
	
	setDescription(description) {
		this.description = description;
		return this;
	}
	
	toJSON() {
		Errors.abstract();
	}
	
	// Returns the contents of this entity as a module-ready configuration for
	// actual use (the current contents are for reading/writing to disk and user
	// configuration during runtime).
	toConf() {
		Errors.abstract();
	}
	
	import(entityInfo) {
		assert(
			entityInfo.type === this.type,
			`Wrong entity type: expected '${this.type}', got '${entityInfo.type}'.`);
		this.importDesc(entityInfo.descriptor);
	}
	
	importDesc(descriptor) {
		Errors.abstract();
	}
	
	export() {
		Errors.abstract();
	}
	
	// For overriding in inheriting classes, should be used to check the
	// validity of the entity's current data.
	// If the data is invalid, a suitable exception should be thrown.
	validate() {
	}
	
	// Creates a copy of this entity with all of its contents.
	clone() {
		Errors.abstract();
	}
	
	static readEntity(entityObject) {
		let type = entityObject.type;
		let instance = EntityFactory.build(type);
		instance.import(entityObject.descriptor);
		instance.validate();
		return instance;
	}
}

module.exports = ConfigEntity;
