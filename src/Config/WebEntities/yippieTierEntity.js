const StaticObjectEntity = require('././staticObjectEntity');

class YippieTierEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'YippieTier'; 					}
	static get BUILDER()	{ return () => new YippieTierEntity(); 	}
	
	constructor() {
		super();
		this.add(
			'images',
			'MultiAsset',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'Yippie',
			})
			.setName('Images')
			.setDescription('Collection of Yippie images for this tier');
	}
}

module.exports = YippieTierEntity;
