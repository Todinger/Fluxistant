const Utils = requireMain('./utils');

class Track {
	constructor(name, trackData) {
		this.name = name;
		this.length = trackData['length'];
	}
}

class TrackManager {
	constructor() {
		this.tracks = {};
	}
	
	loadTracks(data) {
		Object.keys(data).forEach(name => {
			this.tracks[name] = new Track(name, data[name]);
		})
	}
	
	getTrack(name) {
		return this.tracks[name];
	}
	
	getRandomTrack() {
		return Utils.randomValue(this.tracks);
	}
}


module.exports = {
	Track: Track,
	TrackManager: new TrackManager(),
}
