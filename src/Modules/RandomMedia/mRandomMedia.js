const Module = requireMain('module');
const Utils = requireMain('utils');

class MyModule extends Module {
	constructor() {
		super({
			name: 'Random Media',
			tags: ['imgdisp'],
			description: 'A list of functions that can display a random choice from a set of media',
		});

		this.mediaFunctions = {};
	}

	_sendToDisplay(funcObject, displaySendFunc) {
		let options = funcObject.mediaOptions;
		if (!options || options.length === 0) return;

		let selection = Utils.randomElement(options);
		let imageConf = selection.image;
		let soundConf = selection.sound;
		let videoConf = selection.video;
		// let textConf = funcObject.text;
		let imageFileConf = imageConf.file;
		let soundFileConf = soundConf.file;
		let videoFileConf = videoConf.file;
		let hasImage = this.assets.Images.hasKey(imageFileConf.fileKey);
		let hasSound = this.assets.Sounds.hasKey(soundFileConf.fileKey);
		let hasVideo = this.assets.Videos.hasKey(videoFileConf.fileKey);
		// let hasText = Utils.isNonEmptyString(textConf.text);

		let imagePromise = hasImage ?
			this.assets.getFileWeb(imageFileConf) :
			Promise.resolve();

		let soundPromise = hasSound ?
			this.assets.getFileWeb(soundFileConf) :
			Promise.resolve();

		let videoPromise = hasVideo ?
			this.assets.getFileWeb(videoFileConf) :
			Promise.resolve();

		// let _this = this;
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
					// if (hasText) {
					// 	let textData = Utils.clone(textConf);
					// 	textData.text = data.compileText(textData.text);
					// 	_this.broadcastEvent('showText', textData);
					// }
				});
		}
	}

	defineModAssets(modData) {
		modData.addNamedCollection('Images');
		modData.addNamedCollection('Sounds');
		modData.addNamedCollection('Videos');
	}

	defineModConfig(modConfig) {
		modConfig.add('mediaFunctions', 'DynamicArray', 'RandomMediaFunction')
			.setName('Media Functions')
			.setDescription('Functions for showing random media from a collection');

		modConfig.add('mediaToggleFunctions', 'DynamicArray', 'RandomMediaFunction')
			.setName('Media Toggle Functions')
			.setDescription('Functions for showing random media without durations (toggle on/off)');
	}

	makeMediaFunction(func, id, action) {
		let funcObject = this.createFunctionObject(func);

		if (!funcObject.funcID) {
			funcObject.funcID = id;
		}

		funcObject.mediaOptions = func.mediaOptions;
		funcObject.action = (data) => action(funcObject, data);

		return funcObject;
	}

	loadModConfig(conf) {
		this.deactivateFunctions(this.mediaFunctions || {});

		this.mediaFunctions = {};
		if (conf.mediaFunctions) {
			for (let i = 0; i < conf.mediaFunctions.length; i++) {
				let func = conf.mediaFunctions[i];
				let funcObject = this.makeMediaFunction(
					func,
					`MediaFunc[${i}]`,
					(fo, data) => this._sendToDisplay(
						fo,
						parameters => this.broadcastEvent('showImage', parameters),
						data));
				this.mediaFunctions[funcObject.funcID] = funcObject;
			}
		}

		if (conf.mediaToggleFunctions) {
			for (let i = 0; i < conf.mediaToggleFunctions.length; i++) {
				let func = conf.mediaToggleFunctions[i];
				let id = `MediaToggleFunc[${i}]`;
				let funcObject = this.makeMediaFunction(
					func,
					id,
					(fo, data) => this._sendToDisplay(
						fo,
						parameters => {
							parameters.name = `${id}: ${func.name}`;
							this.broadcastEvent('toggleNamed', parameters);
						},
						data));
				this.mediaFunctions[funcObject.funcID] = funcObject;
			}
		}

		this.activateFunctions(this.mediaFunctions);
		this.extraFuncObjects = this.mediaFunctions;
	}
}

module.exports = new MyModule();
