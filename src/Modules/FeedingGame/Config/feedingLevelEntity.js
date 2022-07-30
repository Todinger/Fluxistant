const StaticObjectEntity = requireConfig('./staticObjectEntity');
const ImageEntity = requireModConfig('ImageDisplay', 'imageEntity');

class FeedingLevelEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'FeedingLevel'; 					}
	static get BUILDER()	{ return () => new FeedingLevelEntity(); 	}
	
	constructor() {
		super();
		this.addNaturalNumber('capacity', 100)
			.setName('Capacity')
			.setDescription('How much units of food this level can take before the next level is reached');
		this.addPositiveNumber('multiplier', 1)
			.setName('Point Multiplier')
			.setDescription('Rewarded points from feeding are multiplied by this amount while this level is active');
		this.addChild('backClosedImage', new ImageEntity())
			.setName('Back: Closed Mouth Image')
			.setDescription('Back layer image for the closed-mouth form (will be behind the food)');
		this.addChild('backOpenImage', new ImageEntity())
			.setName('Back: Open Mouth Image')
			.setDescription('Back layer image for the open-mouth form (will be behind the food)');
		this.addChild('frontClosedImage', new ImageEntity())
			.setName('Front: Closed Mouth Image')
			.setDescription('Front layer image for the closed-mouth form (will be in front of the food)');
		this.addChild('frontOpenImage', new ImageEntity())
			.setName('Front: Open Mouth Image')
			.setDescription('Front layer image for the open-mouth form (will be in front of the food)');
	}
}

module.exports = FeedingLevelEntity;
