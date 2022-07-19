const StaticObjectEntity = require('././staticObjectEntity');
const ImageEntity = require('./imageEntity');
const SoundEntity = require('./soundEntity');
const VideoEntity = require('././Assets/videoEntity');

class SingleMediaEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'SingleMedia'; 					}
	static get BUILDER()	{ return () => new SingleMediaEntity(); 	}
	
	constructor() {
		super();
		this.addChild('image', new ImageEntity())
			.setName('Image')
			.setDescription('Image display parameters');
		this.addChild('sound', new SoundEntity())
			.setName('Sound')
			.setDescription('Sound playing parameters');
		this.addChild('video', new VideoEntity())
			.setName('Video')
			.setDescription('Video playing parameters');
	}
}

module.exports = SingleMediaEntity;
