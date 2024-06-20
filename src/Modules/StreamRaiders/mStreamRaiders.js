const Module = requireMain('module');
const SkinathonCharacterEntity = require("./Config/skinathonCharacterEntity");
const SkinathonMilestoneEntity = require("./Config/skinathonMilestoneEntity");
const StreamRaidersManager = requireMain('streamRaidersManager');
const StreamRaidersPurchaseTracker = require("./tracking");
const ModuleAssetLoader = requireMain('moduleAssetLoader');
const Utils = requireMain('./utils');

const MAX_PIXEL_PROGRESS = 1920;
const DEFAULT_MAX_SP = 1100;

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

		this.sortedMilestones = [];
		this.currentSP = 0;
		this.currentPixelProgress = 0;
		this.nextMilestoneIndex = 0;

		this.data = {
			purchases: [],
			users: {},
			skinathons: {},
		};

		this.eventHandlers = {
			skinathonPointsChanged: (newPoints, oldPoints) => this._skinathonPointsChanged(newPoints, oldPoints),
			skinPurchase: (purchaseDetails) => this._skinPurchase(purchaseDetails),
		};

		this.tracker = new StreamRaidersPurchaseTracker(this);
	}

	defineModAssets(modData) {
		modData.addUniformPool('Images');
	}

	defineModConfig(modConfig) {
		modConfig.addNaturalNumber('attackDuration', 0)
			.setName('Attack Duration')
			.setDescription('How long the attack and death animations will be played when a milestone is unlocked');

		modConfig.addNonNegativeNumber('advancementPixelsPerSecond', 0)
			.setName('Advancement Speed (in pixels per second)')
			.setDescription('How quickly characters move on the road');

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

		let defaultMilestoneValues = milestones.addChild('defaultMilestoneValues', new SkinathonMilestoneEntity())
			.setName('Default Milestone Values')
			.setDescription('Default settings that will be applied to all milestones unless overridden (offsets are added instead of replaced)');
		defaultMilestoneValues.getChild('sp').hide();

		milestones.addDynamicArray('milestones', 'SkinathonMilestone')
			.setName('Milestones')
			.setDescription('Settings for the different unlockable milestones');
	}

	loadModConfig(modConfig) {
		if (this.clientsAreConnected) {
			this.syncClients();
		}

		let milestoneConfig = modConfig.milestones;

		this.sortedMilestones = milestoneConfig.milestones.sort((a, b) => a.sp - b.sp);
		let firstPos = milestoneConfig.firstMilestonePos;
		let lastPos = MAX_PIXEL_PROGRESS - milestoneConfig.lastMilestonePos;
		let range = lastPos - firstPos;
		let numMilestones = this.sortedMilestones.length;
		if (numMilestones === 1) {
			this.sortedMilestones.position = lastPos;
		} else {
			let segments = numMilestones - 1;
			for (let i = 0; i < numMilestones; i++) {
				this.sortedMilestones[i].position = firstPos + range * i / segments;
			}
		}
	}

	_enableEventHandlers() {
		StreamRaidersManager.onSkinathonPointsChanged(this.eventHandlers.skinathonPointsChanged);
		StreamRaidersManager.onAnySkinPurchase(this.eventHandlers.skinPurchase);
	}

	_disableEventHandlers() {
		StreamRaidersManager.removeSkinathonPointsChangedCallback(this.eventHandlers.skinathonPointsChanged);
		StreamRaidersManager.removeAnySkinPurchaseCallback(this.eventHandlers.skinPurchase);
	}

	load() {
		this.onClientAttached(async _socket => {
			if (this.enabled) {
				this.syncClients();
			}
		});
	}

	enable() {
		this._enableEventHandlers();
		this.tracker.enable();
	}

	disable() {
		this._disableEventHandlers();
		this.tracker.disable();
	}

	persistentDataLoaded() {
		this.tracker.dataLoaded();
	}


	get hasMilestones() {
		return this.sortedMilestones.length > 0;
	}

	syncClients() {
		setTimeout(async () => {
			await this.sendData();
			setTimeout(() => {
				this.sendState();
			}, 300);
		}, 200);
	}

	getMilestoneData() {
		let cfg = this.config.milestones;
		let def = cfg.defaultMilestoneValues;
		let milestones = [];
		for (let i = 0; i < this.sortedMilestones.length; i++) {
			let milestone = this.sortedMilestones[i];
			milestones.push({
				position: milestone.position,
				bg: {
					locked: imageDefault(milestone.lockedBackImage, def.lockedBackImage),
					unlocked: imageDefault(milestone.unlockedBackImage, def.unlockedBackImage),
				},
				reward: {
					image: imageDefault(milestone.reward.image, def.reward.image),
					centerX: milestone.reward.centerX + def.reward.centerX,
					centerY: milestone.reward.centerY + def.reward.centerY,
					offsetX: milestone.reward.offsetX + def.reward.offsetX,
					offsetY: milestone.reward.offsetY + def.reward.offsetY,
				},
				enemy: {
					image: imageDefault(milestone.enemy.image, def.enemy.image),
					deathImage: imageDefault(milestone.enemy.deathImage, def.enemy.deathImage),
					centerX: milestone.enemy.centerX + def.enemy.centerX,
					centerY: milestone.enemy.centerY + def.enemy.centerY,
					offsetX: milestone.enemy.offsetX + def.enemy.offsetX,
					offsetY: milestone.enemy.offsetY + def.enemy.offsetY,
				},
			});
		}

		return milestones;
	}

	get maxSP() {
		if (this.sortedMilestones.length === 0) {
			return DEFAULT_MAX_SP;
		}

		return this.sortedMilestones[this.sortedMilestones.length - 1].sp;
	}

	async sendData() {
		try {
			let mal = new ModuleAssetLoader(this.assets.Images);
			let data = {
				attackDuration: this.config.attackDuration,
				advancementPixelsPerSecond: this.config.advancementPixelsPerSecond,
				characters: this.config.characters,
				milestones: this.getMilestoneData(),
			}

			let webData = await mal.loadWeb(data);

			this.broadcastEvent('setData', webData);
		} catch (err) {
			this.error(`Error sending data: ${err}`);
		}
	}

	sendState() {
		try {
			let state = {
				sp: this.currentSP,
				pixelProgress: this.pixelProgressFromSP(this.currentSP, this.nextMilestoneIndex),
			};

			if (this.nextMilestoneIndex > 0) {
				state.lastUnlockedMilestoneIndex = this.nextMilestoneIndex - 1;
			}

			this.broadcastEvent('setState', state);
		} catch (err) {
			this.error(`Error sending data: ${err}`);
		}
	}

	_skinathonPointsChanged(newPoints, _oldPoints) {
		if (newPoints < 0) return;
		if (newPoints < this.currentSP) return;
		if (newPoints > this.maxSP) newPoints = this.maxSP;
		this.setSP(newPoints);
	}

	_skinPurchase(purchaseDetails) {
		this.setSP(this.currentSP + purchaseDetails.sp);
	}

	setProgressDirect() {
		this.broadcastEvent('setPixelProgress', {
			pixelProgress: this.currentPixelProgress,
			sp: this.currentSP,
		});
	}

	lastClearedMilestoneIndexForSP(sp) {
		if (sp >= this.maxSP) {
			return this.sortedMilestones.length - 1;
		}

		for (let i = 0; i < this.sortedMilestones.length; i++) {
			if (this.sortedMilestones[i].sp > sp) {
				return i - 1;
			}
		}
	}

	pixelProgressFromSP(sp, nextMilestoneIndex) {
		if (!this.hasMilestones) return 0;

		let leftSP, leftPosition, rightSP, rightPosition;
		if (nextMilestoneIndex === 0) {
			leftSP = 0;
			leftPosition = 0;
			rightSP = this.sortedMilestones[0].sp;
			rightPosition = this.sortedMilestones[0].position;
		} else {
			let leftMilestone, rightMilestone;
			if (nextMilestoneIndex >= this.sortedMilestones.length - 1) {
				leftMilestone = this.sortedMilestones[this.sortedMilestones.length - 1];
				rightMilestone = this.sortedMilestones[this.sortedMilestones.length - 2];
			} else {
				leftMilestone = this.sortedMilestones[nextMilestoneIndex - 1];
				rightMilestone = this.sortedMilestones[nextMilestoneIndex];
			}

			leftSP = leftMilestone.sp;
			leftPosition = leftMilestone.position;
			rightSP = rightMilestone.sp;
			rightPosition = rightMilestone.position;
		}

		let alpha = (sp - leftSP) / (rightSP - leftSP);
		return Math.round(leftPosition + alpha * (rightPosition - leftPosition));
	}

	makeAdvanceEvent(targetPixelProgress, targetSP) {
		return {
			name: 'advance',
			data: {targetPixelProgress, targetSP},
		};
	}

	makeConquerEvent(milestoneIndex) {
		return {
			name: 'conquer',
			data: {milestoneIndex},
		};
	}

	makeLockEvent(milestoneIndex) {
		return {
			name: 'lock',
			data: {milestoneIndex},
		};
	}

	createFlatProgressEvent(newSP) {
		let pixelProgress = Math.round((newSP / this.maxSP) * MAX_PIXEL_PROGRESS);
		return this.makeAdvanceEvent(pixelProgress, newSP);
	}

	createDirectAdvanceEvent(newSP, nextMilestoneIndex) {
		let pixelProgress = this.pixelProgressFromSP(newSP, nextMilestoneIndex);
		return this.makeAdvanceEvent(pixelProgress, newSP);
	}

	createProgressEvents(newSP) {
		if (this.sortedMilestones.length <= 1) {
			return [this.createFlatProgressEvent(newSP)];
		}

		let events = [];
		let lastClearedMilestoneIndex = this.lastClearedMilestoneIndexForSP(newSP);
		for (let index = this.nextMilestoneIndex; index <= lastClearedMilestoneIndex; index++) {
			const milestone = this.sortedMilestones[index];
			events.push(this.makeAdvanceEvent(milestone.position, milestone.sp));
			events.push(this.makeConquerEvent(index));
		}

		let lastClearedMilestoneSP =
			lastClearedMilestoneIndex >= 0 ?
				this.sortedMilestones[lastClearedMilestoneIndex].sp :
				0;

		if (newSP > lastClearedMilestoneSP) {
			let pixelProgress = this.pixelProgressFromSP(newSP, lastClearedMilestoneIndex + 1);
			events.push(this.makeAdvanceEvent(pixelProgress, newSP));
		}

		return {
			nextMilestoneIndex: lastClearedMilestoneIndex + 1,
			events,
		};
	}

	setSP(sp) {
		let events;
		if (sp < this.currentSP) {
			let newNextMilestoneIndex = this.lastClearedMilestoneIndexForSP(sp) + 1;
			events = [this.createDirectAdvanceEvent(sp, newNextMilestoneIndex)];
			for (let index = newNextMilestoneIndex; index < this.nextMilestoneIndex; index++) {
				events.push(this.makeLockEvent(index));
			}

			this.nextMilestoneIndex = newNextMilestoneIndex;
		} else {
			let progress = this.createProgressEvents(sp);
			this.nextMilestoneIndex = progress.nextMilestoneIndex;
			events = progress.events;
		}

		this.currentSP = sp;

		this.broadcastEvent('eventList', events);
	}

	directSetSP(data) {
		if (!Utils.isNonEmptyString(data.firstParam)) {
			return;
		}

		if (!Number.isNaN(data.firstParam)) {
			let sp = parseInt(data.firstParam);
			if (Number.isInteger(sp) && sp >= 0) {
				this.setSP(sp);
			}
		}

		return {
			success: true,
			sp: this.currentSP,
		}
	}

	printUserLifetimeReport(data) {
		let username = data.firstParam;
		if (!username) {
			this.error("No username given.");
			return;
		}

		username = username.toLowerCase();
		let report = this.tracker.getFormattedUserLifetimeReport(username);
		if (report) {
			this.print(report);
		} else {
			this.print("No data available");
		}
	}

	printUserSkinathonReport(data) {
		let username = data.firstParam;
		if (!username) {
			this.error("No username given.");
			return;
		}

		username = username.toLowerCase();
		let report = this.tracker.getFormattedUserSkinathonReport(username);
		if (report) {
			this.print(report);
		} else {
			this.print("No data available.");
		}
	}

	printSkinathonReport() {
		let report = this.tracker.getFormattedLatestSkinathonReport();
		if (!report) {
			this.print("No data available");
			return;
		}

		this.print("Skinathon Report");
		this.print("----------------\n" + report);
	}

	functions = {
		setSP: {
			name: 'Get / Set SP',
			description: 'Gets or set the current SP for the skinathon (use without value to only get the current amount)',
			triggers: [
				this.trigger.cli({
					cmdname: 'sp',
				}),
			],
			action: data => this.directSetSP(data),
		},
		userLifetimeReport: {
			name: 'Print User Lifetime Report',
			description: "Prints a full report of all of the user's purchases in recorded history to the console",
			triggers: [
				this.trigger.cli({
					cmdname: 'user-report',
				}),
			],
			action: (data) => this.printUserLifetimeReport(data),
		},
		userSkinathonReport: {
			name: 'Print User Skinathon Report',
			description: "Prints a report of all of the user's purchases in the latest (or current) skinathon to the console",
			triggers: [
				this.trigger.cli({
					cmdname: 'user-skinathon-report',
				}),
			],
			action: (data) => this.printUserSkinathonReport(data),
		},
		skinathonReport: {
			name: 'Print Skinathon Report',
			description: 'Prints a full report of the latest (or current) skinathon to the console',
			triggers: [
				this.trigger.cli({
					cmdname: 'skinathon-report',
				}),
			],
			action: () => this.printSkinathonReport(),
		},
	}

	variables = [
		this.variable.getter('sp', {
			name: 'Current Skinathon SP (`$sp`)',
			description: 'The current total amount of SP in this Skinathon',
			example: '"We are at $sp so far!" ---When the current is 459---> "We are at 459 so far!"',
			expr: '$sp',
			getter: () => this.currentSP,
		}),
	]
}

module.exports = new StreamRaiders();
