
const IMAGE_LOCATIONS = {
	regular:	'./Images/Parrot-Regular.png',
	mouth:		'./Images/Parrot-Mouth.png',
	look:		'./Images/Parrot-Look.png',
	wing:		'./Images/Parrot-Wing.png',
};

const SOUNDS = {
	hey:		{ location: './Sounds/Hey! Look! Listen!.mp3' },
	laughter:	{ location: './Sounds/Laughter.mp3' },
	behind:		{ location: './Sounds/Look Behind You.mp3' },
	attention:	{ location: './Sounds/Pay Me Attention.mp3' },
	cracker:	{ location: './Sounds/Polly Want a Cracker.mp3' },
	dl6:		{ location: './Sounds/Remember DL-6.mp3' },
	bigcry:		{ location: './Sounds/SQUAAAAAAAWK!.mp3' },
	cry:		{ location: './Sounds/Squawk.mp3' },
	died:		{ location: './Sounds/Died.mp3' },
	lars:		{ location: './Sounds/Lars.mp3' },
	law:		{ location: './Sounds/Law.mp3' },
	what:		{ location: './Sounds/What.mp3' },
};

// const SOUND_LOCATIONS = {
// 	hey:		'./Sounds/Hey! Look! Listen!.mp3',
// 	laughter:	'./Sounds/Laughter.mp3',
// 	behind:		'./Sounds/Look Behind You.mp3',
// 	attention:	'./Sounds/Pay Me Attention.mp3',
// 	cracker:	'./Sounds/Polly Want a Cracker.mp3',
// 	dl6:		'./Sounds/Remember DL-6.mp3',
// 	bigcry:		'./Sounds/SQUAAAAAAAWK!.mp3',
// 	cry:		'./Sounds/Squawk.mp3',
// 	died:		'./Sounds/Died.mp3',
// 	lars:		'./Sounds/Lars.mp3',
// 	law:		'./Sounds/Law.mp3',
// };

/*
const IMAGE_NAMES = Object.keys(IMAGE_LOCATIONS);
const SOUND_NAMES = Object.keys(SOUND_LOCATIONS);

var Sounds = {};
class SoundManagerClass {
	constructor() {
		this._allLoadedListeners = [];
		this._loadedFlags = {};
		this._numLeftToLoad = SOUND_NAMES.length;
		SOUND_NAMES.forEach(name => this._loadedFlags[name] = false);
	}
	
	onDataLoaded(func) {
		if (this._numLeftToLoad == 0) {
			func();
		} else {
			this._allLoadedListeners.push(func);
		}
	}
	
	_loadingFinished() {
		this._allLoadedListeners.forEach(func => func());
		this._allLoadedListeners = null;
	}
	
	_dataLoaded(name) {
		if (!this._loadedFlags[name]) {
			this._loadedFlags[name] = true;
			this._numLeftToLoad--;
			if (this._numLeftToLoad == 0) {
				this._loadingFinished();
			}
		}
	}
	
	loadSounds() {
		Object.keys(SOUND_LOCATIONS).forEach(name => {
			$(`<audio id="sound_${name}" src="${SOUND_LOCATIONS[name]}">`)
			.on('loadeddata', () => this._dataLoaded(name))
			.appendTo('#soundholder');
			Sounds[name] = document.getElementById(`sound_${name}`);
		});
	}
}

var soundManager = new SoundManagerClass();
soundManager.loadSounds();
*/
