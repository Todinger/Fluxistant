const assert = require('assert').strict;
const CandyInflation_BaseEntity = require('./candyInflation_BaseEntity');

class CandyInflation_ExponentialEntity extends CandyInflation_BaseEntity {
	static get TYPE()		{ return 'CandyInflation_Exponential';					}
	static get BUILDER()	{ return () => new CandyInflation_ExponentialEntity();	}
	
	constructor() {
		super('Exponential');
		this.setDescription('The winning image will have its selection odds multiplied every time');
		this.addPositiveNumber('argument', 1)
			.setName('Base')
			.setDescription('The winning image weight will be multiplied by this amount after every drop');
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
		
		let baseEntity = this.getChild('argument');
		assert(
			baseEntity.isSet() && baseEntity.getValue() > 0,
			'Exponential inflation base must be a positive number.');
	}
}

module.exports = CandyInflation_ExponentialEntity;
