const BallConfigEntity = require('./ballConfigEntity');

class WeavableBallConfigEntity extends BallConfigEntity {
	static get TYPE()		{ return 'WeavableBallConfig'; 					}
	static get BUILDER()	{ return () => new WeavableBallConfigEntity(); 	}
	
	constructor() {
		super();
		
		this.addNaturalNumber('yarnToWeave', 5)
			.setName('Yarn to Weave')
			.setDescription('How much yarn needs to be acquired in order to obtain a ball');
	}
	
	setYarnToWeave(amount) {
		this.getChild('yarnToWeave').setValue(amount);
	}
}

module.exports = WeavableBallConfigEntity;
