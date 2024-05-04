const StaticObjectEntity = require('././staticObjectEntity');
const ImageEntity = require('./imageEntity');

class SkinathonCharacterEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'SkinathonCharacter'; 					}
	static get BUILDER()	{ return () => new SkinathonCharacterEntity(); 	}
	
	constructor() {
		super();
		this.addChild('idle', new ImageEntity())
			.setName('Idle Image')
			.setDescription("Image when the character isn't moving.");
		this.addChild('moving', new ImageEntity())
			.setName('Movement Image')
			.setDescription("Image when the character is moving to the next milestone (to the right).");
		this.addChild('attacking', new ImageEntity())
			.setName('Attack Image')
			.setDescription("Image when the character is attacking the enemy (to the right).");
	}
}

module.exports = SkinathonCharacterEntity;
