const Module = requireMain('module');
const Utils = requireMain('utils');

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

		this.data = {
			inventories: {},
		}
	}

	defineModAssets(modData) {
		modData.addNamedCollection('Images');
	}

	defineModConfig(modConfig) {
		modConfig.addDuration('displayDuration', 10)
			.setName('Display Duration')
			.setDescription('Number of seconds to display the sticker on the screen');
		modConfig.addDynamicArray('tiers', 'YippieTier')
			.setName('Tiers')
			.setDescription('All Yippie tiers');
	}

	loadModConfig(conf) {
		if (this.clientsAreConnected) {
			this._setupClients();
		}

		this.yippies = {};
		this.tiers = [];
		for (let i = 0; i < conf.tiers.length; i++) {
			let tier = [];
			Object.values(conf.tiers[i].images.files).forEach(file => {
				this.yippies[file.yd] = file;
				tier.push(file.yd);
			});

			this.tiers.push(tier);
		}
	}

	load() {
		this.onClientAttached(() => {
			this._setupClients();
		});
	}

	_setupClients() {
		this.broadcastEvent("configure", {displayDuration: this.config.displayDuration});
	}


	_inventory(username) {
		return this.data.inventories[username];
	}

	_userExists(username) {
		return username in this.data.inventories;
	}

	_userOwnsYippies(username) {
		return this._userExists(username) && this._inventory(username).length > 0;
	}

	_ensureUser(username) {
		if (!this._userExists(username)) {
			this.data.inventories[username] = [];
		}
	}

	_userOwnsYippie(username, yd) {
		return this._userExists(username) && this._inventory(username).includes(yd);
	}

	_getRandomUserYippie(username) {
		if (!this._userOwnsYippies(username)) {
			return null;
		}

		return Utils.randomElement(this._inventory(username));
	}

	_yippieExists(yd) {
		return yd in this.yippies;
	}

	giveYippie(username, yd, save = true) {
		this._ensureUser(username);
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

		return this.giveYippie(username, Utils.randomElement(missingYds), save);
	}

	_give(data) {
		let params = data.params;
		if (params.length !== 2) {
			this.tellError(data.user, "Please specify a target user and a Yippie.");
			return false;
		}

		let targetUser = params[0];
		let yd = params[1].toLowerCase();

		if (!this._yippieExists(yd)) {
			this.tellError(data.user, "That Yippie doesn't exist!");
			return false;
		}

		this.giveYippie(targetUser, yd);
	}

	async getYippieFile(yd) {
		let yippie = this.yippies[yd];
		if (yippie && yippie.fileKey) {
			let yippieFile = await this.assets.getFileWeb(yippie);
			return yippie.makeDisplayData(yippieFile);
		}

		return null;
	}

	async use(data) {
		let yd;
		if (data.firstParam) {
			yd = data.firstParam;
			if (!this._yippieExists(yd)) {
				this.tellError(data.user, "That Yippie doesn't exist!");
				return false;
			}
			if (!this._userOwnsYippie(data.user.name, yd)) {
				this.tellError(data.user, "Sorry, you don't own that Yippie yet...");
				return false;
			}
		} else if (!this._userOwnsYippies(data.user.name)) {
			this.tellError(data.user, "Sorry, you don't own any Yippies yet...");
			return false;
		} else {
			yd = this._getRandomUserYippie(data.user.name);
		}


		let yippieFile = await this.getYippieFile(yd);
		if (yippieFile) {
			let parameters = {
				image: yippieFile,
			};

			this.broadcastEvent("activate", parameters);
		}
	}


	functions = {
		use: {
			name: 'Use',
			description: "Uses a Yippie",
			triggers: [
				this.trigger.cli({
					cmdname: 'y',
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
	}
}

module.exports = new Yippies();
