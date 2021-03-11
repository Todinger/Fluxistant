const UserEntity = require('./userEntity');

class WelcomeEntity extends UserEntity {
	static get TYPE()		{ return 'Welcome';					}
	static get BUILDER()	{ return () => new WelcomeEntity();	}

	constructor() {
		super();
		
		this.addDynamicArray('messages', 'String')
			.setName('Messages')
			.setDescription('One of these will be selected by the bot to say when the user first talks');
		
		this.addMultiAsset(
			'images',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
			.setName('Images')
			.setDescription('Collection of images to choose from to show for this user when they first talk');
		
		this.addMultiAsset(
			'sounds',
			{
				collection: 'Sounds',
				dataType: 'SOUND',
				elementValueType: 'SoundFile',
			})
			.setName('Sounds')
			.setDescription('Collection of sounds to choose from to play for this user when they first talk');
	}
}

module.exports = WelcomeEntity;
