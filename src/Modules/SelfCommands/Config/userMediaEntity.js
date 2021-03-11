const UserEntity = requireConfig('userEntity');
const ImageEntity = requireModConfig('ImageDisplay', 'imageEntity');
const SoundEntity = requireModConfig('ImageDisplay', 'soundEntity');

class UserMediaEntity extends UserEntity {
	static get TYPE()		{ return 'UserMedia'; 					}
	static get BUILDER()	{ return () => new UserMediaEntity(); 	}
	
	constructor() {
		super();
		this.addChild('image', new ImageEntity())
			.setName('Image')
			.setDescription('Image display parameters');
		this.addChild('sound', new SoundEntity())
			.setName('Sound')
			.setDescription('Sound playing parameters');
	}
}

module.exports = UserMediaEntity;
