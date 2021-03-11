const assert = require('assert').strict;
const _ = require('lodash');
const StaticObjectEntity = requireConfig('staticObjectEntity');

class SoundEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Sound'; 					}
	static get BUILDER()	{ return () => new SoundEntity(); 	}
	
	static makeDisplayData(imageFileEntityConf, savedFile) {
		let dd = _.omit(imageFileEntityConf, 'file');
		dd.url = savedFile.data;
		return dd;
	}
	
	constructor() {
		super();
		this.addSingleAsset('file', { collection: 'Sounds', dataType: 'SOUND' })
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
	
	toConf() {
		let conf = super.toConf();
		conf.makeDisplayData = function(savedFile) {
			return SoundEntity.makeDisplayData(this, savedFile);
		};
		return conf;
	}
}

module.exports = SoundEntity;
