const CandyInflation_BaseEntity = require('./candyInflation_BaseEntity');

class CandyInflation_NoneEntity extends CandyInflation_BaseEntity {
	static get TYPE()		{ return 'CandyInflation_None'; 				}
	static get BUILDER()	{ return () => new CandyInflation_NoneEntity();	}
	
	constructor() {
		super(CandyInflation_NoneEntity.TYPE, 'None');
		this.setDescription('The winning image will have the same odds of being chosen every time');
	}
}

module.exports = CandyInflation_NoneEntity;
