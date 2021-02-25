// const CommandEntity = require('./commandEntity');
// const ImageEntity = require('./imageEntity');
// const SoundEntity = require('./soundEntity');
//
// class ImageCommandEntity extends CommandEntity {
// 	static get TYPE()		{ return 'ImageCommand'; 					}
// 	static get BUILDER()	{ return () => new ImageCommandEntity(); 	}
//
// 	constructor(collectionIDs) {
// 		super({ cmdname: 'newcommand' });
// 		this.addChild('image', new ImageEntity(collectionIDs.images))
// 			.setName('Image')
// 			.setDescription('Image display parameters');
// 		this.addChild('sound', new SoundEntity(collectionIDs.sounds))
// 			.setName('Sound')
// 			.setDescription('Sound playing parameters');
// 	}
//
// 	toConf() {
// 		let conf = super.toConf();
// 		conf.hasImage = this.getChild('image').isSet();
// 		conf.hasSound = this.getChild('sound').isSet();
// 	}
// }
//
// module.exports = ImageCommandEntity;

const CommandEntity = require('./commandEntity');
const ImageEntity = require('./imageEntity');
const SoundEntity = require('./soundEntity');

class ImageCommandEntity extends CommandEntity {
	static get TYPE()		{ return 'ImageCommand'; 					}
	static get BUILDER()	{ return () => new ImageCommandEntity(); 	}
	
	constructor() {
		super({ cmdname: 'newcommand' });
		this.addChild('image', new ImageEntity())
			.setName('Image')
			.setDescription('Image display parameters');
		this.addChild('sound', new SoundEntity())
			.setName('Sound')
			.setDescription('Sound playing parameters');
	}
}

module.exports = ImageCommandEntity;
