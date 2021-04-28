const FunctionEntity = requireConfig('Functions/functionEntity');
const ImageEntity = requireModConfig('ImageDisplay', 'imageEntity');
const SoundEntity = requireModConfig('ImageDisplay', 'soundEntity');
const VideoEntity = requireConfig('./Assets/videoEntity');

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
	}
}

module.exports = ImageFunctionEntity;
