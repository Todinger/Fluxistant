const FunctionEntity = require('./Functions/functionEntity');
const ImageEntity = require('./imageEntity');
const SoundEntity = require('./soundEntity');

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
	}
}

module.exports = ImageFunctionEntity;
