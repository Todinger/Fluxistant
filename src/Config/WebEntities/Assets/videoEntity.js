const _ = require('lodash');
const StaticObjectEntity = require('../staticObjectEntity');

class VideoEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Video';					}
	static get BUILDER()	{ return () => new VideoEntity(); 	}
	
	static makeDisplayData(imageFileEntityConf, savedFile) {
		let dd = _.omit(imageFileEntityConf, 'file');
		dd.url = savedFile.data;
		if (dd.duration) {
			dd.duration *= 1000; // Milliseconds to seconds
		}
		
		return dd;
	}
	
	constructor() {
		super();
		this.addSingleAsset('file', { collection: 'Videos', dataType: 'VIDEO' })
			.setName('Video')
			.setDescription('The video that will be played on the screen');
		this.addNaturalNumber('width')
			.setName('Width')
			.setDescription('Display width on screen');
		this.addInteger('height')
			.setName('Height')
			.setDescription('Display height on screen');
		this.addNaturalNumber('volume')
			.setName('Volume')
			.setDescription('Playback volume (0 - 100)');
	}
	
	getFile() {
		return this.getChild('file');
	}
	
	isSet() {
		return this.getFile().isSet();
	}
	
	// ---- Overrides ---- //
	
	toConf() {
		let conf = super.toConf();
		conf.makeDisplayData = function(savedFile) {
			return VideoEntity.makeDisplayData(this, savedFile);
		};
		return conf;
	}
}

module.exports = VideoEntity;
