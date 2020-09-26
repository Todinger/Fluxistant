var express = require('express');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const USERIMAGE_DIR = '../../Images/User-Specific';
const USERIMAGE_URL = '/assets/user-images/';
const IMAGEDISPLAY_DIR = '../../Images/Display Images';
const IMAGEDISPLAY_URL = '/assets/image-display/';
const SOUNDEFFECTS_DIR = '../../sfx';
const SOUNDEFFECTS_URL = '/assets/sfx/';


class Assets {
	static registerAll(app) {
		Assets.registerUserImages(app);
		Assets.registerDisplayImages(app);
		Assets.registerSoundEffects(app);
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
	
	// Sound Effects
	static registerSoundEffects(app) {
		app.use(SOUNDEFFECTS_URL,
			express.static(path.join(__dirname, SOUNDEFFECTS_DIR)));
	}
	
	static _userImageURL(filename) {
		let parsed = path.parse(filename);
		return USERIMAGE_URL + parsed.name + parsed.ext;
	}
	
	static getUserImages(onDone) {
		glob(path.join(USERIMAGE_DIR, '*.png'), {}, (err, files) => {
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
}

module.exports = Assets;
