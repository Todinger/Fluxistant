const Module = requireMain('module');
const SkinathonCharacterEntity = require("./Config/skinathonCharacterEntity");
const SkinathonMilestoneEntity = require("./Config/skinathonMilestoneEntity");
const StreamRaidersManager = requireMain('streamRaidersManager');
const ModuleAssetLoader = requireMain('moduleAssetLoader');

const MAX_PIXEL_PROGRESS = 1920;

const NUM_OF_CHARACTERS = 4;


function isValidFile(data) {
	return data && data.file && data.file.fileKey;
}

function imageDefault(image, defaultImage) {
	if (isValidFile(image)) {
		return image;
	}

	if (isValidFile(defaultImage)) {
		return defaultImage;
	}

	return null;
}


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
			characters.addElement(new SkinathonCharacterEntity());
		}

		let milestones = modConfig.addGroup('milestones')
			.setName('Milestone Settings')
			.setDescription('Settings for the various milestones that can be unlocked in the skinathon');

		milestones.addNonNegativeNumber('firstMilestonePos', 117)
			.setName('First Milestone Position')
			.setDescription('Distance in pixels from the **left** edge of the road at which to place the first milestone');

		milestones.addNonNegativeNumber('lastMilestonePos', 147)
			.setName('Last Milestone Position')
			.setDescription('Distance in pixels from the **right** edge of the road at which to place the last milestone');

		milestones.addChild('defaultMilestoneValues', new SkinathonMilestoneEntity())
			.setName('Default Milestone Values')
			.setDescription('Default settings that will be applied to all milestones unless overridden (offsets are added instead of replaced)');

		milestones.addDynamicArray('milestones', 'SkinathonMilestone')
			.setName('Milestones')
			.setDescription('Settings for the different unlockable milestones');
	}

	loadModConfig(_modConfig) {
		if (this.clientsAreConnected) {
			setTimeout(async () => await this.sendData(), 500);
		}
	}
	
	load() {
		this.onClientAttached(async _socket => {
			if (this.enabled) {
				await this.sendData();
			}
		});

		StreamRaidersManager.onSkinathonPointsChanged(
			(newPoints, oldPoints) => this._skinathonPointsChanged(newPoints, oldPoints)
		);
	}

	getImage(fileData) {
		let promise =
			fileData.file.fileKey ?
				this.assets.Images.getFileWebByKey(fileData.file.fileKey) :
				Promise.resolve(null);
		promises.push(promise);
		return promise;
	}

	getMilestoneData() {
		let cfg = this.config.milestones;
		let def = cfg.defaultMilestoneValues;
		let sortedConfigMilestones = cfg.milestones.sort((a, b) => a.sp - b.sp);
		let milestones = [];
		for (let i = 0; i < sortedConfigMilestones.length; i++) {
			let milestone = sortedConfigMilestones[i];
			milestones.push({
				bg: {
					locked: imageDefault(milestone.lockedBackImage, def.lockedBackImage),
					unlocked: imageDefault(milestone.unlockedBackImage, def.unlockedBackImage),
				},
				reward: {
					image: imageDefault(milestone.reward.image, def.reward.image),
					offsetX: milestone.reward.offsetX + def.reward.offsetX,
					offsetY: milestone.reward.offsetY + def.reward.offsetY,
				},
				enemy: {
					image: imageDefault(milestone.enemy.image, def.enemy.image),
					deathImage: imageDefault(milestone.enemy.deathImage, def.enemy.deathImage),
					offsetX: milestone.enemy.offsetX + def.enemy.offsetX,
					offsetY: milestone.enemy.offsetY + def.enemy.offsetY,
				},
			});
		}

		return {
			firstMilestonePos: cfg.firstMilestonePos,
			lastMilestonePos: cfg.lastMilestonePos,
			milestones: milestones,
		};
	}

	async sendData() {
		let mal = new ModuleAssetLoader(this.assets.Images);
		let data = {
			characters: this.config.characters,
			milestones: this.getMilestoneData(),
		}

		let webData = await mal.loadWeb(data);

		this.broadcastEvent('setData', webData);
	}

	async sendImages() {
		let promises = [];
		const getImage = (fileData) => {
			let promise =
				fileData.file.fileKey ?
					this.assets.Images.getFileWebByKey(fileData.file.fileKey) :
					Promise.resolve(null);
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

		try {
			await Promise.all(promises);
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
		} catch(err) {
			this.error(err);
		}
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
