const Module = requireMain('module');
const Utils = requireMain('utils');


const ABSOLUTE_MAX_COUNT = 5000;


class Yippies extends Module {
	static Interface = class YippieInterface extends Module.Interface {
		constructor(inst) {
			super(inst);
		}

		defineMethods() {
			return {
				giveYippie: (conf, username, yd, save) =>
					this.inst.giveYippie(username, yd, save),
				giveRandomTieredYippie: (conf, username, tier, save) =>
					this.inst.giveRandomTieredYippie(username, tier, save),
				getYippieFile: async (conf, yd) => await this.inst.getYippieFile(yd),
			};
		}
	};

	constructor() {
		super({
			name: 'Yippies',
			webname: 'yippies',
			source: 'yippies.html',
			debug: true,
		});

		this.yippies = {};
		this.tiers = [];
		this.collections = {
			free: [],
			manual: [],
		};

		this.data = {
			inventories: {},
		}

		this.maxCount = ABSOLUTE_MAX_COUNT;
	}

	defineModAssets(modData) {
		modData.addNamedCollection('Images');
	}

	defineModConfig(modConfig) {
		modConfig.addDuration('displayDuration', 10)
			.setName('Display Duration')
			.setDescription('Number of seconds to display the sticker on the screen');

		modConfig.addNaturalNumber('maxCount', 10)
			.setName('Maximum Count')
			.setDescription('Maximum amount that of Yippies that can be used (as a count argument) in a single command');

		modConfig.addDynamicArray('tiers', 'YippieTier')
			.setName('Tiers')
			.setDescription('All Yippie tiers');

		modConfig.add('free', 'YippieTier')
			.setName('Free Tier')
			.setDescription('Yippies that everyone can use');
		modConfig.add('manual', 'YippieTier')
			.setName('Manual Tier')
			.setDescription('Yippies that can only be granted manually');

		let messages = modConfig.addGroup('messages')
			.setName("Messages")
			.setDescription("Various messages sent by the bot");
		messages.addString('yippieDoesNotExist', "We never had that in our house when the tornado took it.")
			.setName("Missing Yippie")
			.setDescription("Message sent when the specified Yippie ID does not exist");
		messages.addString('yippieNotOwned', "Sorry, you haven't collected that debris yet.")
			.setName("Yippie Not Owned")
			.setDescription("Message sent when the user does not own the specified Yippie");
		messages.addString('noYippiesOwned', "Sorry, you haven't collected any debris yet.")
			.setName("No Yippies Owned")
			.setDescription("Message sent when the user does not own any Yippies");
		messages.addString('yippieListHeader', "Your collected debris:")
			.setName("Yippie List Header")
			.setDescription("Message sent to tell a user what Yippies they have (the list will follow at the end)");
	}

	loadYippieConfig(prevConf, file, collectionName, indexInCollection) {
		let displayYD = file.yd;
		if (!displayYD) {
			throw `A Yippie with an empty IDs found in ${collectionName} (possibly file #${indexInCollection + 1}).`;
		}

		file.displayYD = displayYD;
		let yd = displayYD.toLowerCase();
		if (yd in this.yippies) {
			throw `Duplicate Yippie ID: ${file.yd}`;
		}

		this.yippies[yd] = file;

		let previousSettings = this._findFileInConf(prevConf, file.fileKey);
		if (previousSettings !== null) {
			let oldYD = previousSettings.yd.toLowerCase();
			if (oldYD !== yd) {
				this._renameYippie(oldYD, yd);
			}
		}

		return yd;
	}

	loadCollectionConfig(prevConf, collectionConf, collectionName) {
		if (!collectionConf) {
			return null;
		}

		let collection = [];
		let fileCount = 0;
		Object.values(collectionConf.images.files).forEach(file => {
			let yd = this.loadYippieConfig(prevConf, file, collectionName, fileCount);
			collection.push(yd);
			fileCount++;
		});

		return collection;
	}

	resetYippies() {
		this.yippies = {};
		this.tiers = [];
		this.collections = {
			free: [],
			manual: [],
		};
	}

	loadModConfig(conf, prevConf) {
		if (this.clientsAreConnected) {
			this._setupClients();
		}

		this.resetYippies();

		for (let i = 0; i < conf.tiers.length; i++) {
			let tier = this.loadCollectionConfig(prevConf, conf.tiers[i], `Tier #${i + 1}`);
			this.tiers.push(tier);
		}

		this.collections.free = this.loadCollectionConfig(prevConf, conf.free, "Free Tier");
		this.collections.manual = this.loadCollectionConfig(prevConf, conf.manual, "Manual Tier");

		this.maxCount = conf.maxCount ? Utils.clamp(0, conf.maxCount, ABSOLUTE_MAX_COUNT) : ABSOLUTE_MAX_COUNT;
	}

	load() {
		this.onClientAttached(() => {
			this._setupClients();
		});
	}

	_findFileInConf(conf, fileKey) {
		for (let tier of conf.tiers) {
			if (fileKey in tier.images.files) {
				return tier.images.files[fileKey];
			}
		}

		return null;
	}

	_renameYippie(oldYD, newYD) {
		Object.keys(this.data.inventories).forEach(username => {
			const index = this.data.inventories[username].indexOf(oldYD);
			if (index >= 0) {
				this.data.inventories[username][index] = newYD;
			}
		});
		this.saveData();
	}

	_setupClients() {
		this.broadcastEvent("configure", {displayDuration: this.config.displayDuration});
	}


	_inventory(username) {
		if (this._userExists(username)) {
			return this.data.inventories[username];
		} else {
			return [];
		}
	}

	_userExists(username) {
		return username in this.data.inventories;
	}

	_userOwnsYippies(username) {
		return this._inventory(username).length > 0;
	}

	_userHasYippiesAvailable(username) {
		return this.collections.free.length > 0 || this._userOwnsYippies(username);
	}

	_ensureUser(username) {
		if (!this._userExists(username)) {
			this.data.inventories[username] = [];
		}
	}

	_isFree(yd) {
		return this.collections.free.includes(yd);
	}

	_userOwnsYippie(username, yd) {
		return this._isFree(yd) || (
			this._userExists(username) && this._inventory(username).includes(yd.toLowerCase())
		);
	}

	_getRandomUserYippie(username) {
		const userInventory = this._inventory(username);
		const inventorySelection = Utils.weightedRandomKey({
			free: this.collections.free.length,
			user: userInventory.length,
		});

		const inventory = inventorySelection === "free" ? this.collections.free : userInventory;

		return Utils.randomElement(inventory);
	}

	_yippieExists(yd) {
		return yd in this.yippies;
	}

	giveYippie(username, yd, save = true) {
		this._ensureUser(username);
		yd = yd.toLowerCase();
		if (this._userOwnsYippie(username, yd)) {
			return false;
		}

		this._inventory(username).push(yd);
		if (save) {
			this.saveData();
		}

		return true;
	}

	giveRandomTieredYippie(username, tier, save = true) {
		this._ensureUser(username);
		if (tier < 0 || tier >= this.tiers.length) {
			this.error(`Tier ${tier} reward requested, but only tiers 0 - ${this.tiers.length - 1} exist!`);
			return false;
		}

		let tierYds = this.tiers[tier];
		let userInventory = this._inventory(username);
		let missingYds = Utils.arrayDifference(tierYds, userInventory);
		if (missingYds.length === 0) {
			return false;
		}

		const yd = Utils.randomElement(missingYds);
		if (this.giveYippie(username, yd, save)) {
			return this.yippies[yd].displayYD;
		} else {
			return false;
		}
	}

	_give(data) {
		let params = data.params;
		if (params.length !== 2) {
			this.tellError(data.user, "Please specify a target user and an ID.");
			return false;
		}

		let targetUser = params[0].toLowerCase();
		let yd = params[1].toLowerCase();

		if (!this._yippieExists(yd)) {
			this.tellError(data.user, this.config.messages.yippieDoesNotExist);
			return false;
		}

		this.giveYippie(targetUser, yd);
	}

	async getYippieFile(yd) {
		yd = yd.toLowerCase();
		let yippie = this.yippies[yd];
		if (yippie && yippie.fileKey) {
			let yippieFile = await this.assets.getFileWeb(yippie);
			return yippie.makeDisplayData(yippieFile);
		}

		return null;
	}

	_usageParametersFromNameAndCountArgs(nameArg, countArg) {
		let count = Utils.isNaturalNumberString(countArg) ? Number(countArg) : 1;
		return {
			name: nameArg,
			count,
		}
	}

	_extractUsageParameters(params) {
		let normalizedParams = params;
		if (params.length === 0) {
			normalizedParams = [undefined, undefined];
		} else if (params.length === 1) {
			normalizedParams = [params[0], undefined];
		}

		if (isNaN(normalizedParams[0])) {
			return this._usageParametersFromNameAndCountArgs(normalizedParams[0], normalizedParams[1]);
		}

		return this._usageParametersFromNameAndCountArgs(normalizedParams[1], normalizedParams[0]);
	}

	async use(data) {
		let ydFromUser = undefined;
		let { name, count } = this._extractUsageParameters(data.params);
		let randomize = false;

		if (name) {
			ydFromUser = name.toLowerCase();
			if (!this._yippieExists(ydFromUser)) {
				this.tellError(data.user, this.config.messages.yippieDoesNotExist);
				return false;
			}
			if (!this._userOwnsYippie(data.user.name, ydFromUser)) {
				this.tellError(data.user, this.config.messages.yippieNotOwned);
				return false;
			}
		} else if (!this._userHasYippiesAvailable(data.user.name)) {
			this.tellError(data.user, this.config.messages.noYippiesOwned);
			return false;
		} else {
			randomize = true;
		}

		count = Math.min(count, this.maxCount);

		for (let i = 0; i < count; i++) {
			let yd = randomize ? this._getRandomUserYippie(data.user.name) : ydFromUser;

			let yippieFile = await this.getYippieFile(yd);
			if (yippieFile) {
				let parameters = {
					image: yippieFile,
				};

				this.broadcastEvent("activate", parameters);
			}
		}
	}

	show(data) {
		if (!this._userHasYippiesAvailable(data.user.name)) {
			this.tellError(data.user, this.config.messages.noYippiesOwned);
			return false;
		}

		let message = this.config.messages.yippieListHeader.trim();
		let inventory = this._inventory(data.user.name);
		let freeInventory = this.collections.free;
		message += " " + [...inventory, ...freeInventory].join(", ");

		this.tell(data.user, message);
	}


	functions = {
		use: {
			name: 'Use',
			description: "Uses a Yippie",
			triggers: [
				this.trigger.command({
					cmdname: 's',
				}),
			],
			action: async (data) => this.use(data),
		},
		give: {
			name: 'Give Yippie',
			description: "Gives a Yippie to a specific user (specify the username first, then the Yippie ID)",
			triggers: [
				this.trigger.cli({
					cmdname: 'gy',
				}),
			],
			action: (data) => this._give(data),
		},
		show: {
			name: 'Show Inventory',
			description: "List all the Yippies the user owns",
			triggers: [
				this.trigger.command({
					cmdname: 'debris',
				}),
			],
			action: async (data) => this.show(data),
		},
	}
}

module.exports = new Yippies();
