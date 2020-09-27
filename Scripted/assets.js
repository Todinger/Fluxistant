var express = require('express');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const urljoin = require('url-join');

const Utils = require('./utils');

const USERIMAGE_DIR = '../../Images/User-Specific';
const USERIMAGE_URL = '/assets/user-images/';
const IMAGEDISPLAY_DIR = '../../Images/Display Images';
const IMAGEDISPLAY_URL = '/assets/image-display/';
const SOUNDEFFECTS_DIR = '../../sfx';
const SOUNDEFFECTS_URL = '/assets/sfx/';
const RANDOMIMAGECACHE_DIR = '../../Images/Random Image Cache';
const RANDOMIMAGECACHE_URL = '/assets/random-image-cache/';
const FSHOWER_DIR = '../../Images/F';
const FSHOWER_URL = '/assets/fshower/';
const FSHOWER_SUBDIR_CACHE = 'Defaults/';
const FSHOWER_SUBDIR_USERS = 'User-Specific/';

class Assets {
	static registerAll(app) {
		Assets.registerUserImages(app);
		Assets.registerDisplayImages(app);
		Assets.registerSoundEffects(app);
		Assets.registerRandomImageCache(app);
		Assets.registerFShowerImages(app);
	}
	
	static registerDir(app, dir, url) {
		app.use(url, express.static(path.join(__dirname, dir)));
	}
	
	// Self-Images
	static registerUserImages(app) {
		Assets.registerDir(app, USERIMAGE_DIR, USERIMAGE_URL);
	}
	
	// Image Display
	static registerDisplayImages(app) {
		Assets.registerDir(app, IMAGEDISPLAY_DIR, IMAGEDISPLAY_URL);
	}
	
	// Random Image Cache
	static registerRandomImageCache(app) {
		Assets.registerDir(app, RANDOMIMAGECACHE_DIR, RANDOMIMAGECACHE_URL);
	}
	
	// F Shower Images
	static registerFShowerImages(app) {
		Assets.registerDir(app, FSHOWER_DIR, FSHOWER_URL);
	}
	
	// Sound Effects
	static registerSoundEffects(app) {
		Assets.registerDir(app, SOUNDEFFECTS_DIR, SOUNDEFFECTS_URL);
	}
	
	static _imageURL(baseURL, filename) {
		let parsed = path.parse(filename);
		return urljoin(baseURL, parsed.name + parsed.ext);
	}
	
	static _userImageURL(filename) {
		return Assets._imageURL(USERIMAGE_URL, filename);
	}
	
	static _imageDetails(baseURL, filename) {
		console.log(`_imageDetails("${baseURL}" , "${filename}")`);
		let parsed = path.parse(filename);
		return {
			name: parsed.name,
			url: baseURL + parsed.name + parsed.ext,
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
				let details = Assets._imageDetails(USERIMAGE_URL, file);
				imageList[details.name] = details.url;
			});
			
			onDone(imageList);
		});
	}
	
	static getUserFiles(username) {
		let userFiles = {};
		let imagePath = path.join(USERIMAGE_DIR, username + '.png');
		if (fs.existsSync(imagePath)) {
			userFiles.image = Assets._userImageURL(imagePath);
		}
		
		let soundPath = path.join(USERIMAGE_DIR, username + '.mp3');
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
	
	static getRandomImage(dir, baseURL, onDone, onNotFound, pattern) {
		if (!pattern) {
			pattern = '*.*';
		}
		
		glob(path.join(dir, pattern), {}, (err, files) => {
			
			if (err) {
				console.error(`Filed to read image dir: ${err}`);
				return;
			}
			
			if (!files || files.length == 0) {
				if (onNotFound) {
					onNotFound();
				}
				
				return;
			}
			
			let index = Utils.randomInt(0, files.length);
			let fileDetails = Assets._imageDetails(baseURL, files[index]);
			onDone(fileDetails.name, fileDetails.url);
		});
	}
	
	static getRandomImageFromCache(onDone, onNotFound) {
		Assets.getRandomImage(
			RANDOMIMAGECACHE_DIR,
			RANDOMIMAGECACHE_URL,
			onDone,
			onNotFound);
	}
	
	static getRandomFShowerImage(onDone, onNotFound) {
		Assets.getRandomImage(
			path.join(FSHOWER_DIR, FSHOWER_SUBDIR_CACHE),
			urljoin(FSHOWER_URL, FSHOWER_SUBDIR_CACHE),
			onDone,
			onNotFound);
	}
	
	static getUserFShowerFile(username, onDone, onNotFound) {
		Assets.getRandomImage(
			path.join(FSHOWER_DIR, FSHOWER_SUBDIR_USERS),
			urljoin(FSHOWER_URL, FSHOWER_SUBDIR_USERS),
			onDone,
			onNotFound,
			`${username}*.*`);
	}
}

module.exports = Assets;
