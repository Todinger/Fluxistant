const StaticObjectEntity = require('././staticObjectEntity');

class BallConfigEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'BallConfig'; 					}
	static get BUILDER()	{ return () => new BallConfigEntity(); 	}
	
	constructor() {
		super();
		
		this.addNonNegativeNumber('catchMultiplier', 2)
			.setName('Catch Multiplier')
			.setDescription('Catch chances are multiplied by this amount when this ball is used');
		this.addNonNegativeNumber('shinyMultiplier', 2)
			.setName('Shiny Multiplier')
			.setDescription('Shiny chances are multiplied by this amount when this ball is used');
	}
}

module.exports = BallConfigEntity;
