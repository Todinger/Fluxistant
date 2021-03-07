const StaticObjectEntity = requireConfig('staticObjectEntity');

class UserGroupEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'UserGroup'; 					}
	static get BUILDER()	{ return () => new UserGroupEntity(); 	}
	
	constructor() {
		super();
		this.addString('username')
			.setName('Username')
			.setDescription('Twitch username to set these images for');
		this.addMultiData(
			'images',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'ImageFile',
			})
			.setName('Images')
			.setDescription('Collection of images to choose from for this user to drop down on command');
	}
	
	getUsername() {
		return this.getChild('username').getValue();
	}
	
	getName() {
		let name = super.getName();
		if (!name || name === '') {
			return this.getUsername();
		}
	}
}

module.exports = UserGroupEntity;
