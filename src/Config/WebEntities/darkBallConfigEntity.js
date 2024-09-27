const StaticObjectEntity = require('././staticObjectEntity');

class DarkBallConfigEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'DarkBallConfig'; 					}
	static get BUILDER()	{ return () => new DarkBallConfigEntity(); 	}
	
	constructor() {
		super();
		
		this.addNonNegativeNumber('catchMultiplier', 1)
			.setName('Catch Multiplier')
			.setDescription('Chance of catching Pokyecats is multiplied by this amount when this ball is used');
		this.addNonNegativeNumber('darkMultiplier', 1)
			.setName('Dark Catch Multiplier')
			.setDescription('Chance of catching Darkyecats (when she appears) is multiplied by this amount when this ball is used');
		this.addNaturalNumber('yarnToWeave', 5)
			.setName('Black Yarn to Weave')
			.setDescription('How much black yarn needs to be acquired in order to obtain a dark ball');
	}

	setYarnToWeave(amount) {
		this.getChild('yarnToWeave').setValue(amount);
	}
}

module.exports = DarkBallConfigEntity;
