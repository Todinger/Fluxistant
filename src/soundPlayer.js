/*const path = require('path');
const _ = require('lodash');
const play = require('audio-play');
const load = require('audio-loader');

const fs = require('fs').promises;
const decode = require('audio-decode');

const Speaker = require('speaker');
// Create the Speaker instance
const speaker = new Speaker({
	channels: 2,          // 2 channels
	bitDepth: 16,         // 16-bit samples
	sampleRate: 44100     // 44,100 Hz sample rate
});

const pcm = require('pcm-util');

const CACHE_MAX_FILE_COUNT = 50;

class SoundPlayer {
	constructor() {
		this.cache = {};    // Cache of our sound files, up to the limit
		this.lruQueue = []; // The keys of this.cache ordered by when they were recently used
	}
	
	async play(filePath, volume) {
		let file = path.resolve(filePath);
		let audio;
		if (file in this.cache) {
			this._bringToQueueFront(file);
			audio = this.cache[file];
		} else {
			if (this.lruQueue.length === CACHE_MAX_FILE_COUNT) {
				let fileToRemove = this.lruQueue.shift();
				delete this.cache[fileToRemove];
			}
			
			// audio = await load(file);

			let buffer = await fs.readFile(file);
			audio = await decode(buffer);
			
			this.cache[file] = audio;
			this.lruQueue.push(file);
		}
		
		if (isNaN(volume)) {
			volume = 1;
		}
		
		// return play(audio, {volume, rate: 2});
		let pcmData = pcm.toArrayBuffer(audio);
		let pcmBuffer = Buffer.from(pcmData);
		return speaker.write(pcmBuffer);
	}
	
	_bringToQueueFront(file) {
		_.pull(this.lruQueue, file);
		this.lruQueue.push(file);
	}
}

module.exports = new SoundPlayer();
*/
