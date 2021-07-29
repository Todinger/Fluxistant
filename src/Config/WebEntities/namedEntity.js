const StaticObjectEntity = require('./staticObjectEntity');
const Errors = require('../../errors');

function isNonEmptyString(obj) {
	return (typeof obj == 'string') && (obj.length > 0);
}

class NamedEntity extends StaticObjectEntity {
	static get TYPE()		{ return null; }	// Avoid construction (abstract type)
	
	constructor() {
		super();
	}
	
	getNameOverride() {
		Errors.abstract();
	}
	
	// ---- Overrides ---- //
	
	getDisplayName() {
		let name = super.getName();
		let displayName = super.getDisplayName();
		let nameOverride = this.getNameOverride();
		
		return (isNonEmptyString(name) && name) ||
			(isNonEmptyString(nameOverride) && nameOverride) ||
			(isNonEmptyString(displayName) && displayName) ||
			undefined;
	}
}

module.exports = NamedEntity;
