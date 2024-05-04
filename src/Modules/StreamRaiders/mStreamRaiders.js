const Module = requireMain('module');
const SkinathonCharacter = require("./Config/skinathonCharacterEntity");
const StreamRaidersManager = requireMain('streamRaidersManager');

const MAX_PIXEL_PROGRESS = 1920;

const NUM_OF_CHARACTERS = 4;

class StreamRaiders extends Module {
	constructor() {
		super({
			name: 'Stream Raiders',
			webname: 'streamRaiders',
			source: 'streamRaiders.html',
		});
	}

	defineModAssets(modData) {
		modData.addUniformPool('Images');
	}

	defineModConfig(modConfig) {
		let characters = modConfig.addFixedArray('characters', 'SkinathonCharacter')
			.setName('Characters')
			.setDescription('Configuration for the displayed "character" skins');

		for (let i = 0; i < NUM_OF_CHARACTERS; i++) {
			characters.addElement(new SkinathonCharacter());
		}

		modConfig.addDynamicArray('milestones', 'SkinathonMilestone')
			.setName('Milestones')
			.setDescription('Settings for the different unlockable milestones');
	}

	loadModConfig(_modConfig) {
		if (this.clientsAreConnected) {
			setTimeout(() => this.sendImages(), 500);
		}
	}
	
	load() {
		this.onClientAttached(_socket => {
			if (this.enabled) {
				this.sendImages();
			}
		});

		StreamRaidersManager.onSkinathonPointsChanged(
			(newPoints, oldPoints) => this._skinathonPointsChanged(newPoints, oldPoints)
		);
	}

	getCharacterImages(character) {
		return {
			idle: character.idle.file.fileKey,
			moving: character.moving.file.fileKey,
			attacking: character.attacking.file.fileKey,
		};
	}

	sendImages() {
		let promises = [];
		const getImage = (fileData) => {
			let promise = this.assets.Images.getFileWebByKey(fileData.file.fileKey);
			promises.push(promise);
			return promise;
		};

		let images = {
			characters: this.config.characters.map(character => ({
				idle: getImage(character.idle),
				moving: getImage(character.moving),
				attacking: getImage(character.attacking),
			})),
		}

		Promise.all(promises)
			.then(async (_files) => {
				for (let i = 0; i < NUM_OF_CHARACTERS; i++) {
					let character = images.characters[i];
					images.characters[i] = {
						idle: (await character.idle).data,
						moving: (await character.moving).data,
						attacking: (await character.attacking).data,
					};
				}

				// let parameters = {
				// 	characters: images.characters.map(async (filePromise) => (await filePromise).data),
				// };

				this.broadcastEvent('setImages', images);
			})
			.catch(err => {
				this.error(err);
			});
	}

	_skinathonPointsChanged(newPoints, _oldPoints) {
		if (newPoints < 0) return;
		const MAX_SP = 100;
		if (newPoints > MAX_SP) newPoints = MAX_SP;
		let pixelProgress = Math.round((newPoints / MAX_SP) * MAX_PIXEL_PROGRESS);
		this.broadcastEvent('setPixelProgress', {pixelProgress, sp: newPoints});
	}
}

module.exports = new StreamRaiders();
