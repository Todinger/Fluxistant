const StaticObjectEntity = requireConfig('staticObjectEntity');
const ValueEntity = requireConfig('valueEntity');

class SoundEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Sound'; 					}
	static get BUILDER()	{ return () => new SoundEntity(); 	}
	
	constructor() {
		super(SoundEntity.TYPE);
		this.addChild('filename', new ValueEntity())
			.setDescription('The name of the sound file that will be displayed.');
		this.addChild('volume', new ValueEntity())
			.setDescription('Volume at which to play the sound (not implemented yet).');
	}
	
	isSet() {
		return this.getChild('filename').isSet();
	}
}

module.exports = SoundEntity;
