const assert = require('assert').strict;
const express = require('express');
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const urljoin = require('url-join');
const cli = require('./cliManager');
const Utils = require('./utils');

// The "_DIR" paths here can be changed freely and should point to the
// relative (or absolute) paths where the corresponding directories are 
// located, but the URLs are used as they are in client scripts, so changing
// these would require changing some files in the Modules/ folder

const ASSET_BASE_DIR = '../../../';
const IMAGE_ASSETS_DIR = ASSET_BASE_DIR + 'Images/';
const SOUND_ASSETS_DIR = ASSET_BASE_DIR + 'sfx/';

// For self-images of users, used by self-commands and some other stuff
const USERIMAGE_DIR = IMAGE_ASSETS_DIR + 'User-Specific';
const USERIMAGE_URL = '/assets/user-images/';

// Used for displaying images on command
const IMAGEDISPLAY_DIR = IMAGE_ASSETS_DIR + 'Display Images';
const IMAGEDISPLAY_URL = '/assets/image-display/';

// Used for... well... sound effects
const SOUNDEFFECTS_DIR = SOUND_ASSETS_DIR;
const SOUNDEFFECTS_URL = '/assets/sfx/';

// Used for displaying random images (the RandomImage module)
const RANDOMIMAGECACHE_DIR = IMAGE_ASSETS_DIR + 'Random Image Cache';
const RANDOMIMAGECACHE_URL = '/assets/random-image-cache/';

// Random image cache and user-specific images for the F Shower module
const FSHOWER_DIR = IMAGE_ASSETS_DIR + 'F';
const FSHOWER_URL = '/assets/fshower/';
const FSHOWER_SUBDIR_CACHE = 'Defaults/';
const FSHOWER_SUBDIR_USERS = 'User-Specific/';

// This class is in charge of everything related to the above directories,
// and of registering directories with URLs in general
class AssetManager {
	constructor() {
		this.app = null;
	}
	
	// Call this BEFORE using any registration functions, naturally
	init(app) {
		this.app = app;
	}
	
	registerAll() {
		// this.registerUserImages();
		// this.registerDisplayImages();
		// this.registerSoundEffects();
		// this.registerRandomImageCache();
		// this.registerFShowerImages();
	}
	
	registerDir(dir, url) {
		assert(this.app, 'Please initialize AssetManager before using it.');
		
		cli.log(`[Assets] Registering "${dir}" as "${url}"`);
		this.app.use(url, express.static(dir));
	}
	
	// General registration function:
	// Registers the relative path <dir> under the address <url>.
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
	
	// TODO: Remove after transition to configurations of Catastrophe module
	// Local path of the sound effects directory.
	getSoundEffectsDir() {
		return SOUNDEFFECTS_DIR;
	}
	
	// Gets the URL of an image from its path.
	// 
	// Parameters:
	// baseURL		The general URL of the images the given image is a part of
	// 				(e.g. RANDOMIMAGECACHE_URL).
	// filename		Path to the image in question.
	_imageURL(baseURL, filename) {
		let parsed = path.parse(filename);
		return urljoin(baseURL, parsed.name + parsed.ext);
	}
	
	// Gets the URL of an image in the User Image folder from its local path.
	// 
	// Parameters:
	// filename		Path to the image in question.
	_userImageURL(filename) {
		return this._imageURL(USERIMAGE_URL, filename);
	}
	
	// Gets an object with a [name] and [url] properties describing the given
	// file of the given URL space.
	// 
	// Parameters:
	// baseURL		The general URL of the images the given image is a part of
	// 				(e.g. RANDOMIMAGECACHE_URL).
	// filename		Path to the image in question.
	_imageDetails(baseURL, filename) {
		let parsed = path.parse(filename);
		return {
			name: parsed.name,
			url: baseURL + parsed.name + parsed.ext,
		};
	}
	
	// Gets a collection of user images in the form of { username: url }.
	// Only supports PNG files at the moment.
	// 
	// Parameters:
	// onDone(images)	Function to invoke when finished. The parameter will
	// 					contain the images that were found.
	getUserImages(onDone) {
		glob(path.join(USERIMAGE_DIR, '*.png'), {}, (err, files) => {
			if (err) {
				cli.error(`Filed to read user images: ${err}`);
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
	
	// Checks if there is a user image and sound for the specified username
	// in the user images directory, and returns information of the found files.
	// In other words, given "username", this function checks if "username.png"
	// and "username.mp3" exist in the user images directory.
	// The return object looks like so:
	// 	{
	// 		image: {
	// 			path: <image path>,
	// 			url: <image url>
	// 		},
	// 		sound: <sound url>
	// 	}
	// Each of the .image and .sound properties may be absent, if their
	// respective files were not found.
	// 
	// Parameters:
	// username		User identifier to look for.
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
	
	// Gets a random image from the given directory, assuming the URL that
	// the directory is mapped to is the given baseURL.
	// When done, the onDone function is called with the file's name and URL.
	// If no image was found, onNotFound() is called instead.
	// This function searches for the patter "*.*" (that is, any file with
	// any extension), but a different file pattern may be supplied instead.
	// 
	// Parameters:
	// dir					Directory to search in
	// baseURL				URL the directory is mapped to
	// onDone(name, url)	Function to call when a file is found and selected
	// onNotFound()			Function to call when no image matching the pattern
	// 						is found
	// pattern				Custom search pattern to use
	getRandomImage(dir, baseURL, onDone, onNotFound, pattern) {
		if (!pattern) {
			pattern = '*.*';
		}
		
		glob(path.join(dir, pattern), {}, (err, files) => {
			if (err) {
				cli.error(`Filed to read image dir: ${err}`);
				return;
			}
			
			if (!files || files.length === 0) {
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
	
	// Gets a random image from the random image cache (RANDOMIMAGECACHE_DIR).
	// 
	// Parameters:
	// onDone(name, url)	Function to call when a file is found and selected
	// onNotFound()			Function to call when no image is found
	getRandomImageFromCache(onDone, onNotFound) {
		this.getRandomImage(
			RANDOMIMAGECACHE_DIR,
			RANDOMIMAGECACHE_URL,
			onDone,
			onNotFound);
	}
	
	// Gets a random image from the F Shower image cache (FSHOWER_DIR).
	// 
	// Parameters:
	// onDone(name, url)	Function to call when a file is found and selected
	// onNotFound()			Function to call when no image is found
	getRandomFShowerImage(onDone, onNotFound) {
		this.getRandomImage(
			path.join(FSHOWER_DIR, FSHOWER_SUBDIR_CACHE),
			urljoin(FSHOWER_URL, FSHOWER_SUBDIR_CACHE),
			onDone,
			onNotFound);
	}
	
	// Gets a user-specific image from the F Shower image cache (FSHOWER_DIR).
	// The selected image is under the FSHOWER_SUBDIR_USERS subdirectory and
	// must start with the user's name.
	// 
	// Parameters:
	// onDone(name, url)	Function to call when the image is found
	// onNotFound()			Function to call when the image is not found
	getUserFShowerFile(username, onDone, onNotFound) {
		this.getRandomImage(
			path.join(FSHOWER_DIR, FSHOWER_SUBDIR_USERS),
			urljoin(FSHOWER_URL, FSHOWER_SUBDIR_USERS),
			onDone,
			onNotFound,
			`${username.toLowerCase()}*.*`);
	}
	
	// Gets a random file from the given directory, using the given pattern or
	// the "*.*" pattern if none is given.
	// When done, the onDone function is called with the file's name.
	// If no image was found, onNotFound() is called instead.
	//
	// Parameters:
	// dir			Directory to search in
	// onDone(name)	Function to call when a file is found and selected
	// onNotFound()	Function to call when no image matching the pattern is found
	// pattern		Optional custom search pattern to use
	getRandomLocalFile(dir, onDone, onNotFound, pattern) {
		if (!pattern) {
			pattern = '*.*';
		}
		
		glob(path.join(dir, pattern), {}, (err, files) => {
			if (err) {
				cli.error(`Filed to read dir ${dir}: ${err}`);
				return;
			}
			
			if (!files || files.length === 0) {
				if (onNotFound) {
					onNotFound();
				}
				
				return;
			}
			
			let index = Utils.randomInt(0, files.length);
			onDone(files[index]);
		});
	}
}

module.exports = new AssetManager();
