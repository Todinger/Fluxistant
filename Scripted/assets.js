const express = require('express');
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

class AssetManager {
	constructor() {
		this.app = null;
	}
	
	init(app) {
		this.app = app;
	}
	
	registerAll() {
		this.registerUserImages();
		this.registerDisplayImages();
		this.registerSoundEffects();
		this.registerRandomImageCache();
		this.registerFShowerImages();
	}
	
	registerDir(dir, url) {
		console.log(`Registering "${dir}" as "${url}"`);
		this.app.use(url, express.static(dir));
	}
	
	registerRelativeDir(dir, url) {
		this.app.use(url, express.static(path.join(__dirname, dir)));
	}
	
	// Self-Images
	registerUserImages() {
		this.registerRelativeDir(USERIMAGE_DIR, USERIMAGE_URL);
	}
	
	// Image Display
	registerDisplayImages() {
		this.registerRelativeDir(IMAGEDISPLAY_DIR, IMAGEDISPLAY_URL);
	}
	
	// Random Image Cache
	registerRandomImageCache() {
		this.registerRelativeDir(RANDOMIMAGECACHE_DIR, RANDOMIMAGECACHE_URL);
	}
	
	// F Shower Images
	registerFShowerImages() {
		this.registerRelativeDir(FSHOWER_DIR, FSHOWER_URL);
	}
	
	// Sound Effects
	registerSoundEffects() {
		this.registerRelativeDir(SOUNDEFFECTS_DIR, SOUNDEFFECTS_URL);
	}
	
	_imageURL(baseURL, filename) {
		let parsed = path.parse(filename);
		return urljoin(baseURL, parsed.name + parsed.ext);
	}
	
	_userImageURL(filename) {
		return this._imageURL(USERIMAGE_URL, filename);
	}
	
	_imageDetails(baseURL, filename) {
		let parsed = path.parse(filename);
		return {
			name: parsed.name,
			url: baseURL + parsed.name + parsed.ext,
		};
	}
	
	getUserImages(onDone) {
		glob(path.join(USERIMAGE_DIR, '*.png'), {}, (err, files) => {
			if (err) {
				console.error(`Filed to read user images: ${err}`);
				return;
			}
			
			let imageList = {};
			files.forEach(file => {
				let details = this._imageDetails(USERIMAGE_URL, file);
				imageList[details.name] = details.url;
			});
			
			onDone(imageList);
		});
	}
	
	getUserFiles(username) {
		let userFiles = {};
		let imagePath = path.join(USERIMAGE_DIR, username + '.png');
		if (fs.existsSync(imagePath)) {
			userFiles.image = {
				path: imagePath,
				url: this._userImageURL(imagePath),
			};
		}
		
		let soundPath = path.join(USERIMAGE_DIR, username + '.mp3');
		if (fs.existsSync(soundPath)) {
			userFiles.sound = this._userImageURL(soundPath);
		}
		
		return userFiles;
	}
	
	getUserImagesSync() {
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
	
	getRandomImage(dir, baseURL, onDone, onNotFound, pattern) {
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
			let fileDetails = this._imageDetails(baseURL, files[index]);
			onDone(fileDetails.name, fileDetails.url);
		});
	}
	
	getRandomImageFromCache(onDone, onNotFound) {
		this.getRandomImage(
			RANDOMIMAGECACHE_DIR,
			RANDOMIMAGECACHE_URL,
			onDone,
			onNotFound);
	}
	
	getRandomFShowerImage(onDone, onNotFound) {
		this.getRandomImage(
			path.join(FSHOWER_DIR, FSHOWER_SUBDIR_CACHE),
			urljoin(FSHOWER_URL, FSHOWER_SUBDIR_CACHE),
			onDone,
			onNotFound);
	}
	
	getUserFShowerFile(username, onDone, onNotFound) {
		this.getRandomImage(
			path.join(FSHOWER_DIR, FSHOWER_SUBDIR_USERS),
			urljoin(FSHOWER_URL, FSHOWER_SUBDIR_USERS),
			onDone,
			onNotFound,
			`${username.toLowerCase()}*.*`);
	}
}

module.exports = new AssetManager();
