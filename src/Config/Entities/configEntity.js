const assert = require('assert').strict;
const Errors = requireMain('./errors');
const EntityFactory = require('../entityFactory');

class ConfigEntity {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	static get GUITYPE()    { return null; }    // Specifies which GUI class to use to edit entities of this type
	
	constructor() {
		this.type = this.constructor.TYPE;
		this.description = undefined;
		this.name = undefined;
		this.hidden = false;
		this.id = null; // EVERY entity should have this, set from outside by its parent
		
		this.displayName = null;
	}
	
	hasName() {
		return this.name && this.name !== '';
	}
	
	getName() {
		return this.name;
	}
	
	setName(name) {
		this.name = name;
		return this;
	}
	
	getDescription() {
		return this.description;
	}
	
	
	setDescription(description) {
		this.description = description;
		return this;
	}
	
	get isHidden() {
		return this.hidden;
	}
	
	hide() {
		this.hidden = true;
		return this;
	}
	
	show() {
		this.hidden = false;
		return this;
	}
	
	getID() {
		return this.id;
	}
	
	setID(id) {
		this.id = id;
		return this;
	}
	
	getDisplayName() {
		let res = this.getName();
		if ((!res || res === '') && this.displayName) {
			res = this.displayName;
		}
		
		return res;
	}
	
	setDisplayName(displayName) {
		this.displayName = displayName;
	}
	
	_escapeID(value) {
		return (''+value).replace('.', '\\.');
	}
	
	extendID(addendum, childEntity) {
		childEntity.setID(`${this.id}.${this._escapeID(addendum)}`);
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
		
		// Don't import names and descriptions if we have them already - this is so that when
		// these are changed in the code the saved configuration files don't override them
		if (entityInfo.name && !this.name) {
			this.setName(entityInfo.name);
		}
		
		if (entityInfo.description && !this.description) {
			this.setDescription(entityInfo.description);
		}
		
		this.hidden = !!entityInfo.hidden;
	}
	
	// noinspection JSUnusedLocalSymbols
	importDesc(descriptor) {
		Errors.abstract();
	}
	
	export() {
		let descriptor = this.exportDesc();
		descriptor.type = this.type;
		descriptor.name = this.name;
		descriptor.description = this.description;
		if (this.hidden) {
			descriptor.hidden = true;
		}
		
		return descriptor;
	}
	
	exportDesc() {
		Errors.abstract();
	}
	
	// For overriding in inheriting classes, should be used to check the
	// validity of the entity's current data.
	// If the data is invalid, a suitable exception should be thrown.
	validate() {
	}
	
	// Creates a copy of this entity with all of its contents.
	clone() {
		let copy = this.cloneImpl();
		copy.setName(this.getName());
		copy.setDescription(this.getDescription());
		copy.hidden = this.hidden;
		copy.id = this.id;
		return copy;
	}
	
	cloneImpl() {
		Errors.abstract();
	}
	
	// noinspection JSUnusedLocalSymbols
	buildFrom(descriptor) {
		Errors.abstract();
	}
	
	_performValidationStep(action, stepIdentifier) {
		try {
			action();
		} catch (err) {
			if (!err.path) {
				err.path = [];
			}
			
			err.path.unshift(stepIdentifier);
			throw err;
		}
	}
	
	static buildEntity(entityObject, id) {
		let type = entityObject.type;
		let instance = EntityFactory.build(type);
		instance.buildFrom(entityObject.descriptor);
		instance.setID(id);
		instance.setName(entityObject.name);
		instance.setDescription(entityObject.description);
		instance.validate();
		return instance;
	}
	
	static readEntity(entityObject) {
		let type = entityObject.type;
		let instance = EntityFactory.build(type);
		instance.import(entityObject);
		instance.validate();
		return instance;
	}
}

module.exports = ConfigEntity;
