const StaticObjectEntity = requireConfig('./staticObjectEntity');

class TwisterLevelEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'TwisterLevel'; 					}
	static get BUILDER()	{ return () => new TwisterLevelEntity(); 	}
	
	constructor() {
		super();
		this.addNaturalNumber('spToClear', 20)
			.setName('SP to Clear')
			.setDescription('How many SP are needed in order to clear this level');
		this.addNaturalNumber('timeLimit', 600)
			.setName('Time Limit')
			.setDescription('Maximum time (in seconds) that the level continues before the twister ends');
	}
}

module.exports = TwisterLevelEntity;
