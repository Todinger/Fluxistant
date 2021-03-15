const ImageFileEntity = requireConfig('Assets/imageFileEntity');

class CandyFileEntity extends ImageFileEntity {
	static get TYPE()		{ return 'CandyFile';					}
	static get BUILDER()	{ return () => new CandyFileEntity(); 	}
	
	constructor(fileKey) {
		super(fileKey);
		this.addNaturalNumber('weight')
			.setName('Weight')
			.setDescription('Relative chance for this candy to be selected');
		this.addNumber('reward')
			.setName('Reward')
			.setDescription('Amount of points to give the user for getting this candy (can be negative, points will be deducted)');
		this.addBoolean('winning')
			.setName('Winner')
			.setDescription('Enable to make getting this candy win the game for the viewer');
		this.addString('userBonus')
			.setName('User Bonus')
			.setDescription('This user will get bonus points for getting this candy');
		this.addNumber('userBonusAmount')
			.setName('Bonus Amount')
			.setDescription('The amount of bonus points for the specified user getting this candy (can be negative, points will be deducted)');
	}
	
	// ---- Overrides ---- //
}

module.exports = CandyFileEntity;
