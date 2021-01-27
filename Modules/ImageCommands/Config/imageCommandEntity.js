const assert = require('assert').strict;
const CommandEntity = requireConfig('commandEntity');
const ImageEntity = requireModConfig('ImageDisplay', 'imageEntity');
const SoundEntity = requireModConfig('ImageDisplay', 'soundEntity');

class ImageCommandEntity extends CommandEntity {
	static get TYPE()		{ return 'ImageCommand'; 					}
	static get BUILDER()	{ return () => new ImageCommandEntity(); 	}
	
	constructor() {
		super(ImageCommandEntity.TYPE, () => new CommandEntity());
		this.addChild('image', new ImageEntity())
			.setDescription('Configures which image to display and how.');
		this.addChild('sound', new SoundEntity())
			.setDescription('Configures which sound to play and how.');
	}
	
	
	// ---- Overrides ---- //
	
	validate() {
		assert(
			this.getChild('image').isSet() ||
			this.getChild('sound').isSet(),
			'An Image Command must have an image or a sound set.');
	}
}

module.exports = ImageCommandEntity;
