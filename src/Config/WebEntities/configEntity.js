const MiniEventNotifier = require('../miniEventNotifier');
const Errors = require('../../errors');
const EntityFactory = require('../entityFactory');

class ConfigEntity extends MiniEventNotifier {
	static get TYPE()       { return null; }	// Avoid construction (abstract type)
	static get GUITYPE()    { return null; }    // Specifies which GUI class to use to edit entities of this type
	
	constructor() {
		super();
		
		if (ConfigEntity.debug) {
			this.dbg = `${ConfigEntity.dbgNext++}`;
		}
		
		this.type = this.constructor.TYPE;
		this.name = undefined;
		this.description = undefined;
		this.helpText = undefined;
		this.hidden = false;
		this.id = null; // EVERY entity should have this, set from outside by its parent
		
		// Information pertaining to the GUI display only (nothing functional)
		this.displayName = null;
		this.displayIndex = undefined;
		this.advanced = false; // Any entity with this set to true will only show up in "Advanced Mode"
		
		// Events (these initializations are to make the IDE treat the
		// variables as functions properly without giving warnings about types)
		this.eOnChanged = (x) => x;
		this.eChanged = (x) => x;
		this.eOnChangedRemove = (x) => x;
		[this.eOnChanged, this.eChanged, this.eOnChangedRemove] = this.event('changed');
	}
	
	hasName() {
		return this.name && this.name !== '';
	}
	
	getName() {
		return this.name;
	}
	
	setName(name) {
		this.name = name;
		this.eChanged();
		return this;
	}
	
	getDescription() {
		return this.description;
	}
	
	
	setDescription(description) {
		this.description = description;
		this.eChanged();
		return this;
	}
	
	getHelp() {
		return this.helpText;
	}
	
	
	setHelp(helpText) {
		this.helpText = helpText;
		this.eChanged();
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
	
	get isAdvanced() {
		return this.advanced;
	}
	
	setAdvanced() {
		this.advanced = true;
		return this;
	}
	
	setSimple() {
		this.advanced = false;
		return this;
	}
	
	getID() {
		return this.id;
	}
	
	setID(id) {
		this.id = id;
		
		// if (ConfigEntity.debug) {
		// 	if (id === 'mod.Candy Game.functions.0.triggers') {
		// 		console.log(`Triggers self: ${this.dbg}`);
		// 	}
		// }
		
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
	
	getDisplayIndex() {
		return this.displayIndex;
	}
	
	setDisplayIndex(displayIndex) {
		this.displayIndex = displayIndex;
	}
	
	_escapeID(value) {
		return (''+value).replace('.', '\\.');
	}
	
	extendID(addendum, childEntity) {
		childEntity.setID(`${this.id}.${this._escapeID(addendum)}`);
		
		// if (ConfigEntity.debug) {
		// 	if (childEntity.id === 'mod.Candy Game.functions.0.triggers') {
		// 		console.log(`Self: ${this.dbg} / Triggers: ${childEntity.dbg}`);
		// 	}
		// }
	}
	
	// Returns the contents of this entity as a module-ready configuration for
	// actual use (the current contents are for reading/writing to disk and user
	// configuration during runtime).
	toConf() {
		Errors.abstract();
		return null;
	}
	
	_assignableFrom(type) {
		return type === this.type;
	}
	
	import(entityInfo, lenient) {
		if (ConfigEntity.debug) {
			this.dbg = `${this.dbg} / import`;
		}
		
		if (!lenient && entityInfo.type !== this.type) {
			throw `Wrong entity type: expected '${this.type}', got '${entityInfo.type}'.`;
		} else if (lenient && !this._assignableFrom(entityInfo.type)) {
			return;
		}
		
		this.importDesc(entityInfo.descriptor, lenient);
		
		// Don't import names and descriptions if we have them already - this is so that when
		// these are changed in the code the saved configuration files don't override them
		if (entityInfo.name && !this.name) {
			this.setName(entityInfo.name);
		}
		
		if (entityInfo.description && !this.description) {
			this.setDescription(entityInfo.description);
		}
		
		if (entityInfo.helpText && !this.helpText) {
			this.setHelp(entityInfo.helpText);
		}
		
		this.hidden = !!entityInfo.hidden;
	}
	
	// noinspection JSUnusedLocalSymbols
	importDesc(descriptor, lenient) {
		Errors.abstract();
	}
	
	export() {
		let descriptor = this.exportDesc();
		descriptor.type = this.type;
		descriptor.name = this.name;
		descriptor.description = this.description;
		descriptor.helpText = this.helpText;
		if (this.hidden) {
			descriptor.hidden = true;
		}
		
		return descriptor;
	}
	
	exportDesc() {
		Errors.abstract();
		return null;
	}
	
	// For overriding in inheriting classes, should be used to check the
	// validity of the entity's current data.
	// If the data is invalid, a suitable exception should be thrown.
	validate() {
	}
	
	// Creates a copy of this entity with all of its contents.
	clone() {
		let copy = this.cloneImpl();
		
		if (ConfigEntity.debug) {
			copy.dbg = `${copy.dbg} / clone`;
			// if (this.id === 'mod.Candy Game.functions.0.triggers') {
			// 	console.log(`Trigger <${this.dbg}> copied to <${copy.dbg}>`);
			// }
		}
		
		copy.setName(this.getName());
		copy.setDescription(this.getDescription());
		copy.setHelp(this.getHelp());
		copy.setID(this.id);
		copy.hidden = this.hidden;
		copy.displayName = this.displayName;
		copy.displayIndex = this.displayIndex;
		copy.advanced = this.advanced;
		return copy;
	}
	
	cloneImpl() {
		Errors.abstract();
		return null;
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
		
		if (ConfigEntity.debug) {
			instance.dbg = `${instance.dbg} / build`;
		}
		
		instance.buildFrom(entityObject.descriptor);
		instance.setID(id);
		instance.setName(entityObject.name);
		instance.setDescription(entityObject.description);
		instance.setHelp(entityObject.helpText);
		instance.validate();
		return instance;
	}
	
	static readEntity(entityObject, lenient) {
		let type = entityObject.type;
		let instance = EntityFactory.build(type);
		
		if (ConfigEntity.debug) {
			instance.dbg = `${instance.dbg} / read`;
		}
		
		instance.import(entityObject, lenient);
		instance.validate();
		return instance;
	}
}

ConfigEntity.dbgNext = 0;
ConfigEntity.debug = false;

module.exports = ConfigEntity;
