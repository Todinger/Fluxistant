const FunctionEntity = require('./Functions/functionEntity');
const ImageEntity = require('./imageEntity');
const SoundEntity = require('./soundEntity');
const VideoEntity = require('././Assets/videoEntity');
const MediaTextDisplayEntity = require('./mediaTextDisplayEntity');

class ImageFunctionEntity extends FunctionEntity {
	static get TYPE()		{ return 'ImageFunction'; 					}
	static get BUILDER()	{ return () => new ImageFunctionEntity(); 	}
	
	constructor() {
		super();
		this.getChild('name').show();
		this.addChild('image', new ImageEntity())
			.setName('Image')
			.setDescription('Image display parameters');
		this.addChild('sound', new SoundEntity())
			.setName('Sound')
			.setDescription('Sound playing parameters');
		this.addChild('video', new VideoEntity())
			.setName('Video')
			.setDescription('Video playing parameters');
		this.addChild('text', new MediaTextDisplayEntity())
			.setName('Text')
			.setDescription('Text to display onscreen');
	}
}

module.exports = ImageFunctionEntity;
