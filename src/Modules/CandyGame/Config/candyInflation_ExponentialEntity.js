const CandyInflation_BaseEntity = require('./candyInflation_BaseEntity');
const NumberEntity = requireConfig('numberEntity');

class CandyInflation_ExponentialEntity extends CandyInflation_BaseEntity {
	static get TYPE()		{ return 'CandyInflation_Exponential';					}
	static get BUILDER()	{ return () => new CandyInflation_ExponentialEntity();	}
	
	constructor() {
		super('Exponential');
		this.setDescription('The winning image will have its selection odds multiplied every time');
		this.addChild('argument', new NumberEntity(1))
			.setName('Base')
			.setDescription('The winning image weight will be multiplied by this amount after every drop');
	}
}

module.exports = CandyInflation_ExponentialEntity;
