var express = require('express');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const Utils = require('./utils');

const USERIMAGE_DIR = '../../Images/User-Specific';
const USERIMAGE_URL = '/assets/user-images/';
const IMAGEDISPLAY_DIR = '../../Images/Display Images';
const IMAGEDISPLAY_URL = '/assets/image-display/';
const SOUNDEFFECTS_DIR = '../../sfx';
const SOUNDEFFECTS_URL = '/assets/sfx/';
const RANDOMIMAGECACHE_DIR = '../../Images/Random Image Cache';
const RANDOMIMAGECACHE_URL = '/assets/random-image-cache/';

class Assets {
	static registerAll(app) {
		Assets.registerUserImages(app);
		Assets.registerDisplayImages(app);
		Assets.registerSoundEffects(app);
		Assets.registerRandomImageCache(app);
	}
	
	// Self-Images
	static registerUserImages(app) {
		app.use(USERIMAGE_URL,
			express.static(path.join(__dirname, USERIMAGE_DIR)));
	}
	
	// Image Display
	static registerDisplayImages(app) {
		app.use(IMAGEDISPLAY_URL,
			express.static(path.join(__dirname, IMAGEDISPLAY_DIR)));
	}
	
	// Random Image Cache
	static registerRandomImageCache(app) {
		app.use(RANDOMIMAGECACHE_URL,
			express.static(path.join(__dirname, RANDOMIMAGECACHE_DIR)));
	}
	
	// Sound Effects
	static registerSoundEffects(app) {
		app.use(SOUNDEFFECTS_URL,
			express.static(path.join(__dirname, SOUNDEFFECTS_DIR)));
	}
	
	static _userImageURL(filename) {
		let parsed = path.parse(filename);
		return USERIMAGE_URL + parsed.name + parsed.ext;
	}
	
	static _cacheImageDetails(filename) {
		let parsed = path.parse(filename);
		return {
			name: parsed.name,
			url: RANDOMIMAGECACHE_URL + parsed.name + parsed.ext,
		};
	}
	
	static getUserImages(onDone) {
		glob(path.join(USERIMAGE_DIR, '*.png'), {}, (err, files) => {
			if (err) {
				console.error(`Filed to read user images: ${err}`);
				return;
			}
			
			let imageList = {};
			files.forEach(file => {
				imageList[username] = Assets._userImageURL(file);
			});
			
			onDone(imageList);
		});
	}
	
	static getUserFiles(username) {
		let userFiles = {};
		let imagePath = path.join(USERIMAGE_DIR, username + '.png');
		console.log(`Checking: ${imagePath}`);
		if (fs.existsSync(imagePath)) {
			userFiles.image = Assets._userImageURL(imagePath);
		}
		
		let soundPath = path.join(USERIMAGE_DIR, username + '.mp3');
		console.log(`Checking: ${soundPath}`);
		if (fs.existsSync(soundPath)) {
			userFiles.sound = Assets._userImageURL(soundPath);
		}
		
		return userFiles;
	}
	
	static getUserImagesSync() {
		let imageFiles = glob.sync(path.join(USERIMAGE_DIR, '*.png'));
		let imageList = {};
		files.forEach(file => {
			let username = path.parse(file).name;
			let imageext = path.parse(file).ext;
			let imageurl = USERIMAGE_URL + username + imageext;
			imageList[username] = imageurl;
		});
		
		return imageList;
	}
	
	static getRandomImageFromCache(onDone) {
		glob(path.join(RANDOMIMAGECACHE_DIR, '*.*'), {}, (err, files) => {
			// if (err) {
			// 	console.error(`Filed to read image cache: ${err}`);
			// 	return;
			// }
			
			if (!files || files.length == 0) {
				return;
			}
			
			let index = Utils.randomInt(0, files.length);
			let fileDetails = Assets._cacheImageDetails(files[index]);
			onDone(fileDetails.name, fileDetails.url);
		});
	}
}

module.exports = Assets;
