const assert = require('assert').strict;
const CandyInflation_BaseEntity = require('./candyInflation_BaseEntity');

class CandyInflation_LinearEntity extends CandyInflation_BaseEntity {
	static get TYPE()		{ return 'CandyInflation_Linear';					}
	static get BUILDER()	{ return () => new CandyInflation_LinearEntity();	}
	
	constructor() {
		super('Linear');
		this.setDescription('The winning image will have its selection odds increased by a fixed amount every time');
		this.addPositiveNumber('argument', 1)
			.setName('Weight')
			.setDescription('The winning image weight will be increased by this amount after every drop');
	}
	
	validate() {
		// We skip the inherited validate() function here because that'll make
		// a non-positive error here come from the child element, which will just
		// say "This value must be positive."
		// By having the child validation fail and also not using it here, we
		// allow the configuration GUI to display the field itself in red but give
		// a custom error message for this class instead.
		//
		// super.validate();
		
		let weightEntity = this.getChild('argument');
		assert(
			weightEntity.isSet() && weightEntity.getValue() > 0,
			'Linear inflation weight must be a positive number.');
	}
}

module.exports = CandyInflation_LinearEntity;
