const assert = require('assert').strict;
const StaticObjectEntity = require('./staticObjectEntity');

class SoundEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Sound'; 					}
	static get BUILDER()	{ return () => new SoundEntity(); 	}

	constructor() {
		super();
		this.addSingleData('file', { collection: 'Sounds', dataType: 'SOUND' })
			.setName('Sound')
			.setDescription('The sound that will be played');
		this.addNumber('volume', 100)
			.setName('Volume')
			.setDescription('Volume at which to play the sound (not implemented yet)');
	}

	getVolume() {
		return this.getChild('volume').getValue();
	}

	isSet() {
		return this.getChild('file').isSet();
	}

	isVolumeSet() {
		return this.getChild('volume').isSet();
	}


	// ---- Overrides ---- //

	validate() {
		super.validate();
		let volume = this.getVolume();
		assert(
			!this.isSet() || !this.isVolumeSet() || (0 <= volume && volume <= 100),
			`Volume must be bet 0 and 100.`);
	}
}

module.exports = SoundEntity;

// const assert = require('assert').strict;
// const StaticObjectEntity = require('./staticObjectEntity');
//
// class SoundEntity extends StaticObjectEntity {
// 	static get TYPE()		{ return 'Sound'; 					}
// 	static get BUILDER()	{ return () => new SoundEntity(); 	}
//
// 	constructor() {
// 		super();
// 		this.addString('filename')
// 			.setName('File Name')
// 			.setDescription('The name of the sound file that will be displayed.');
// 		this.addNumber('volume', 100)
// 			.setName('Volume')
// 			.setDescription('Volume at which to play the sound (not implemented yet).');
// 	}
//
// 	getFilename() {
// 		return this.getChild('filename').getValue();
// 	}
//
// 	getVolume() {
// 		return this.getChild('volume').getValue();
// 	}
//
// 	isSet() {
// 		return this.getChild('filename').isSet();
// 	}
//
// 	isVolumeSet() {
// 		return this.getChild('volume').isSet();
// 	}
//
//
// 	// ---- Overrides ---- //
//
// 	validate() {
// 		super.validate();
// 		let volume = this.getVolume();
// 		assert(
// 			!this.isSet() || !this.isVolumeSet() || (0 <= volume && volume <= 100),
// 			`Volume must be bet 0 and 100.`);
// 	}
// }
//
// module.exports = SoundEntity;
