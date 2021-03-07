const _ = require('lodash');
const DataFileEntity = require('./dataFileEntity');

class SoundFileEntity extends DataFileEntity {
	static get TYPE()		{ return 'SoundFile';					}
	static get BUILDER()	{ return () => new SoundFileEntity();	}
	
	static makeDisplayData(soundFileEntityConf, savedFile) {
		let dd = _.omit(soundFileEntityConf, 'fileKey');
		dd.url = savedFile.data;
		return dd;
	}
	
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
	
	toConf() {
		let conf = super.toConf();
		conf.makeDisplayData = function(savedFile) {
			return SoundFileEntity.makeDisplayData(this, savedFile);
		};
		return conf;
	}
}

module.exports = SoundFileEntity;
