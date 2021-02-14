const assert = require('assert').strict;
const CommandEntity = requireConfig('commandEntity');
const ImageEntity = requireModConfig('ImageDisplay', 'imageEntity');
const SoundEntity = requireModConfig('ImageDisplay', 'soundEntity');

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
	
	
	// ---- Overrides ---- //
	
	validate() {
		assert(
			this.getChild('image').isSet() ||
			this.getChild('sound').isSet(),
			'An Image Command must have an image or a sound set.');
	}
}

module.exports = ImageCommandEntity;
