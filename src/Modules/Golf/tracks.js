const Utils = requireMain('./utils');

class Track {
	constructor(trackData) {
		this.name = trackData.name;
		this.length = trackData.length;
	}
}

class TrackManager {
	constructor() {
		this.clearTracks();
	}
	
	clearTracks() {
		this.tracks = {};
	}
	
	loadTracks(trackList) {
		trackList.forEach(trackData => {
			this.tracks[trackData.name] = new Track(trackData);
		})
	}
	
	get hasTracks() {
		return Object.keys(this.tracks).length > 0;
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
