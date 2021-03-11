const UserEntity = requireConfig('userEntity');

class UserGroupEntity extends UserEntity {
	static get TYPE()		{ return 'UserGroup'; 					}
	static get BUILDER()	{ return () => new UserGroupEntity(); 	}
	
	constructor() {
		super();
		this.addMultiAsset(
			'images',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
			.setName('Images')
			.setDescription('Collection of images to choose from for this user to drop down on command');
	}
}

module.exports = UserGroupEntity;
