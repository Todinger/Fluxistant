'use strict';

const _ = require('lodash');
const Module = requireMain('module');
const Utils = requireMain('utils');

const DESCRIPTION =
`Allows you to define your own functions which show images and/or play sounds on the main overlay.

Add a function for each image/sound you want, set its triggers (e.g. commands or keyboard shortcuts), and when these
triggers are activated, the configured image and/or sound will be shown/played. It will wait until oen image/sound is
done showing before showing another one, if activated rapidly.

Main overlay address for browser sources: http://localhost:3333/mod/ScriptedModules/ScriptedModules.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

class ImageCommands extends Module {
	constructor() {
		super({
			name: 'Image Commands',
			tags: ['imgdisp', 'textdisp'],
			description: DESCRIPTION,
		});
		
		this.imageFunctions = {};
	}
	
	_makeDisplayData(displayObject, file) {
		let dd = _.omit(displayObject, 'file');
		dd.url = file.data;
		dd.duration = dd.duration ? 1000 * dd.duration : undefined;
		return dd;
	}
	
	_sendToDisplay(funcObject, displaySendFunc, data) {
		let imageConf = funcObject.image;
		let soundConf = funcObject.sound;
		let videoConf = funcObject.video;
		let textConf = funcObject.text;
		let imageFileConf = imageConf.file;
		let soundFileConf = soundConf.file;
		let videoFileConf = videoConf.file;
		let hasImage = this.assets.Images.hasKey(imageFileConf.fileKey);
		let hasSound = this.assets.Sounds.hasKey(soundFileConf.fileKey);
		let hasVideo = this.assets.Videos.hasKey(videoFileConf.fileKey);
		let hasText = Utils.isNonEmptyString(textConf.text);
		
		let imagePromise = hasImage ?
			this.assets.getFileWeb(imageFileConf) :
			Promise.resolve();
		
		let soundPromise = hasSound ?
			this.assets.getFileWeb(soundFileConf) :
			Promise.resolve();
		
		let videoPromise = hasVideo ?
			this.assets.getFileWeb(videoFileConf) :
			Promise.resolve();
		
		let _this = this;
		if (hasImage || hasSound || hasVideo) {
			Promise.all([imagePromise, soundPromise, videoPromise])
			.then(function([imageFile, soundFile, videoFile]) {
				let parameters = {};
				if (hasImage) {
					parameters.image = imageConf.makeDisplayData(imageFile); //Utils.objectWith(cmdObject.image, { url: imageFile.data });
				}
				
				if (hasSound) {
					parameters.sound = soundConf.makeDisplayData(soundFile);
				}
				
				if (hasVideo) {
					parameters.video = videoConf.makeDisplayData(videoFile);
				}
				
				displaySendFunc(parameters);
				if (hasText) {
					let textData = Utils.clone(textConf);
					textData.text = data.compileText(textData.text);
					_this.broadcastEvent('showText', textData);
				}
			});
		}
	}
	
	defineModAssets(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Sounds');
		modData.addNamedCollection('Videos');
	}
	
	defineModConfig(modConfig) {
		modConfig.add(
			'imageFunctions',
			'DynamicArray',
			'ImageFunction')
		.setName('Image Functions')
		.setDescription('Functions for showing images and/or playing sounds');
		
		modConfig.add(
			'toggleFunctions',
			'DynamicArray',
			'ImageFunction')
		.setName('Image Toggle Functions')
		.setDescription('Functions for showing media without durations (toggle on/off)');
	}
	
	makeImageFunction(func, id, action) {
		let funcObject = this.createFunctionObject(func);
		
		if (!funcObject.funcID) {
			funcObject.funcID = id;
		}
		
		funcObject.image = func.image;
		funcObject.sound = func.sound;
		funcObject.video = func.video;
		funcObject.text = func.text;
		funcObject.action = (data) => action(funcObject, data);
		
		return funcObject;
	}
	
	loadModConfig(conf) {
		this.deactivateFunctions(this.imageFunctions || {});
		
		this.imageFunctions = {};
		if (conf.imageFunctions) {
			for (let i = 0; i < conf.imageFunctions.length; i++) {
				let func = conf.imageFunctions[i];
				let funcObject = this.makeImageFunction(
					func,
					`ImageFunc[${i}]`,
					(fo, data) => this._sendToDisplay(
							fo,
							parameters => this.broadcastEvent('showImage', parameters),
							data));
				this.imageFunctions[funcObject.funcID] = funcObject;
			}
		}
		
		if (conf.toggleFunctions) {
			for (let i = 0; i < conf.toggleFunctions.length; i++) {
				let func = conf.toggleFunctions[i];
				let id = `ImageToggleFunc[${i}]`;
				let funcObject = this.makeImageFunction(
					func,
					id,
					(fo, data) => this._sendToDisplay(
						fo,
						parameters => {
							parameters.name = `${id}: ${func.name}`;
							this.broadcastEvent('toggleNamed', parameters);
						},
						data));
				this.imageFunctions[funcObject.funcID] = funcObject;
			}
		}
		
		this.activateFunctions(this.imageFunctions);
	}
}

module.exports = new ImageCommands();
