const StaticObjectEntity = requireConfig('staticObjectEntity');

class SoundEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Sound'; 					}
	static get BUILDER()	{ return () => new SoundEntity(); 	}
	
	constructor() {
		super();
		this.addString('filename')
			.setName('File Name')
			.setDescription('The name of the sound file that will be displayed.');
		this.addNumber('volume', 100)
			.setName('Volume')
			.setDescription('Volume at which to play the sound (not implemented yet).');
	}
	
	isSet() {
		return this.getChild('filename').isSet();
	}
}

module.exports = SoundEntity;
