const AssetFileEntity = require('./assetFileEntity');

class SoundFileEntity extends AssetFileEntity {
	static get TYPE()		{ return 'SoundFile';					}
	static get BUILDER()	{ return () => new SoundFileEntity();	}
	
	constructor(fileKey) {
		super(fileKey);
		this.addNaturalNumber('volume')
			.setName('Volume')
			.setDescription('Playback volume (0 - 100)');
	}
	
	// ---- Overrides ---- //
	
	get hasExtraData() {
		return true;
	}
}

module.exports = SoundFileEntity;
