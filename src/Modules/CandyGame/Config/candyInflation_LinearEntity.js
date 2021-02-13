const CandyInflation_BaseEntity = require('./candyInflation_BaseEntity');
const NumberEntity = requireConfig('numberEntity');

class CandyInflation_LinearEntity extends CandyInflation_BaseEntity {
	static get TYPE()		{ return 'CandyInflation_Linear';					}
	static get BUILDER()	{ return () => new CandyInflation_LinearEntity();	}
	
	constructor() {
		super(CandyInflation_LinearEntity.TYPE, 'Linear');
		this.setDescription('The winning image will have its selection odds increased by a fixed amount every time');
		this.addChild('argument', new NumberEntity(0))
			.setName('Weight')
			.setDescription('The winning image weight will be increased by this amount after every drop');
	}
}

module.exports = CandyInflation_LinearEntity;
