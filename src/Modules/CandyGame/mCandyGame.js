'use strict';

const assert = require('assert').strict;
const Module = requireMain('module');
const Utils = requireMain('utils');

// // File structure:
// // 	{
// // 		"CandyName"
// // 	}
// const CANDY_FILENAME = 'candy.json';
//
const CANDY_DEFAULTS = {
	weight: 25,
	reward: 50,
	imageWidth: 100,
	imageHeight: 100,
	userBonusAmount: 500,
};

const INFLATIONS = {
	none:			()		 =>	(start)       => start,
	linear:			(weight) =>	(start, step) => start + step * weight,
	exponential:	(base)   =>	(start, step) => start * (base ** step),
}

const DESCRIPTION =
`Adds a "Candy Game" to the stream which can be started either freely by
specific people or by anyone through a channel reward redemption.

During the game, people can use the candy drop command, \`!gimme\`, to
have the bot choose a random candy from the candy database and drop a shower
of them on the main overlay.

Using the command costs a small amount of points, and each candy has its own
value of points it grants the player for getting it.

Most candy have the same fixed, positive value, with three exceptions:
1. A "bust" candy which deducts points instead of giving them.
2. A personal user-specific candy which grants its "owner" extra points.
3. The "winning" candy which grants a large amount of points and ends the game.

When a player gets the winning candy, their name is displayed on the text
display client web page with a Halloween-ish effect.
The winning candy has a low chance of being found at first (well, the same
chance as everything else, but there are a lot of candy options so it's a
small chance), but every time someone drops a candy that chance increases.
This is to ensure that the game becomes easy to end after a while.

The chances are decided by a "weight" value given to each type of candy, and
the weight of the winning candy is "inflated" based on the number of candies
that have been dropped so far via an inflation function.

Note: I've been saying "winning candy" in singular form until now, but in
actuality there can be more than one winning candy.
Check Winning in a candy's data to make it a winning one.
All winning candy weights are inflated in the same way, but you can change
their starting weights to be different.

Main overlay address for browser sources: http://localhost:3333/mod/ScriptedModules/ScriptedModules.html

(Note: the port 3333 is the default one, but if you change it in the main settings,
you will need to adjust that address accordingly.`;

// Candy Game
// ----------
// Adds a "Candy Game" to the stream which can be started either freely by
// specific people or by anyone through a channel reward redemption.
// During the game, people can use the candy drop command, !gimme, to have the
// bot choose a random candy from the candy database and drop a shower of them
// on its client web page.
// Using the command costs a small amount of points, and each candy has its own
// value of points it grants the player for getting it.
// Most candy have the same fixed, positive value, with three exceptions:
// 1. A "bust" candy which deducts points instead of giving them.
// 2. A personal user-specific candy which grants its "owner" extra points.
// 3. The "winning" candy which grants a large amount of points and ends the
//    game.
// When a player gets the winning candy, their name is displayed on the text
// display client web page with a Halloween-ish effect.
// 
// The winning candy has a low chance of being found at first (well, the same
// chance as everything else, but there are a lot of candy options so it's a
// small chance), but every time someone drops a candy that chance increases.
// This is to ensure that the game becomes easy to end after a while.
// 
// The chances are decided by a "weight" value given to each type of candy, and
// the weight of the winning candy is "inflated" based on the number of candies
// that have been dropped so far via an inflation function.
// I set it to use a linear function with a step size of 5, but I've added some
// other options as well, so feel free to use whatever works best for you.
// 
// Note: I've been saying "winning candy" in singular form until now, but in
// actuality there can be more than one winning candy.
// Set <"winning": true> in a candy's data to make it a winning one.
// All winning candy weights are inflated in the same way, but you can change
// their starting weights to be different.
class CandyGame extends Module {
	constructor() {
		super({
			name: 'Candy Game',
			tags: ['imgdrop', 'textdisp'],
			description: DESCRIPTION,
		});
		
		this.candyDefaults = {};
		
		this.candyData = {};
		this.ongoing = false;
		this.imageDirURL = null;
		
		this.winningWeightInflation = INFLATIONS.linear(5);
		this.candyCount = 0;
	}
	
	defineModAssets(modData) {
		modData.addWeightedPool('Images');
	}
	
	
	defineModConfig(modConfig) {
		modConfig.add('candyInflation', 'CandyInflation')
			.setName('Candy Inflation')
			.setDescription('Optional inflation of win chances to control the length of the game');
		
		modConfig.addDynamicArray('winEffects', 'ImageEffect')
			.setName('Winning Candy Effects')
			.setDescription('Special effects to apply to winning candy images');
		modConfig.addDynamicArray('bonusEffects', 'ImageEffect')
			.setName('Bonus Candy Effects')
			.setDescription('Special effects to apply to candy images that grant a bonus');
		
		let defs = modConfig.addObject('candyDefaults')
			.setName('Candy Defaults')
			.setDescription('Default values to use for candy - these are overridden by specific candy settings');
		defs.addNumber('weight', 25)
			.setName('Weight')
			.setDescription('Higher relative to other weights = more likely to be picked');
		defs.addInteger('reward', 50)
			.setName('Reward')
			.setDescription('Amount of StreamElements loyalty points given when found (enter a negative number for a penalty)');
		defs.addInteger('imageWidth', 100)
			.setName('Image Width')
			.setDescription('Width in pixels');
		defs.addInteger('imageHeight', 100)
			.setName('Image Height')
			.setDescription('Height in pixels');
		defs.addInteger('userBonus', 500)
			.setName('User Bonus')
			.setDescription('Reward for a user finding their own special candy');
		
		modConfig.add(
			'images',
			'MultiAsset',
			{
				collection: 'Images',
				dataType: 'IMAGE',
				elementValueType: 'CandyFile',
			})
			.setName('Images')
			.setDescription('The collection of candy that can rain down from above (like frogs!)');
	}
	
	loadModConfig(conf) {
		if (conf.candyInflation && conf.candyInflation.type) {
			let inflationFuncMaker = INFLATIONS[conf.candyInflation.type];
			let inflationValue = conf.candyInflation.argument;
			this.winningWeightInflation = inflationFuncMaker(inflationValue);
		}
		
		let defs = conf.candyDefaults;
		this.candyDefaults = {
			weight: defs.weight || CANDY_DEFAULTS.weight,
			reward: defs.reward || CANDY_DEFAULTS.reward,
			width: defs.imageWidth || CANDY_DEFAULTS.imageWidth,
			height: defs.imageHeight || CANDY_DEFAULTS.imageHeight,
			userBonusAmount: defs.userBonusAmount || CANDY_DEFAULTS.userBonusAmount,
		};
		
		this.assets.Images.setWeights(Utils.objectMap(
			conf.images.files,
			(fileKey, file) => file.weight !== undefined ? file.weight : defs.weight));
	}
	
	
	startGame(user) {
		if (this.ongoing) {
			this.tell(user, 'A candy game is already taking place!');
			return false;
		}
		
		this.ongoing = true;
		this.say(`${user.displayName} has started a candy game!`);
		this.say('Use !gimme (costs 10 pixels) to drop candy and win pixels! The game ends when the gold-wrapped chocolate coins are found, granting the winner 1000 pixels!');
		this.candyCount = 0;
		return true;
	}
	
	endGame(user) {
		if (!this.ongoing) {
			this.tell(user, "You can't stop a game that isn't running!");
			return;
		}
		
		this.ongoing = false;
		this.say(`Sorry folks, ${user.displayName} has ended the candy game!`);
	}
	
	announceWinner(user) {
		this.say("The candy game has ended! The winner's name will be shown on-screen. Thank you for playing! =D");
		this.broadcastEvent('showText', {
			text: `${user.displayName} wins!`,
			style: 'Creepy',
			color: '#EF8D01',
			duration: 10000,
		});
	}
	
	getCandyWeight(fileKey, weight) {
		let files = this.config.images.files || {}; // The "|| {}" is to shut the IDE up with its errors
		let candy = files[fileKey];
		if (candy.winning) {
			// noinspection UnnecessaryLocalVariableJS
			weight = this.winningWeightInflation(
				weight,
				this.candyCount);
		}
		
		return weight;
	}
	
	candyRequest(user) {
		if (!this.ongoing) {
			return;
		}
		
		let fileKey = this.assets.Images.selectFileKey(
			(fileKey, weight) => this.getCandyWeight(fileKey, weight));
		if (!fileKey) {
			this.warn('No candy files found.');
			return;
		}
		
		let files = this.config.images.files || {}; // The "|| {}" is to shut the IDE up with its errors
		let candy = Utils.clone(files[fileKey]);
		Utils.applyDefaults(candy, this.candyDefaults);
		this.candyCount++;
		
		let reward = candy.reward;
		if (reward === undefined) {
			reward = this.candyDefaults.reward;
		}
		
		let userBonusRewarded = false;
		if (candy.userBonus) {
			if (candy.userBonus.toLowerCase() === user.name.toLowerCase()) {
				if (candy.userBonusAmount !== undefined) {
					reward += candy.userBonusAmount;
				} else {
					reward += this.candyDefaults.userBonus.amount;
				}
				
				userBonusRewarded = true;
			}
		}
		
		try {
			this.modifyUserPoints(user, reward).then().catch();
		} catch (err) {
			this.error(err);
		}
		
		if (candy.winning) {
			this.ongoing = false;
			this.announceWinner(user);
		}
		
		this.assets.Images.getFileWebByKey(fileKey)
			.then(file => {
				assert(
					this.config.images.files && (file.fileKey in this.config.images.files),
					'File missing from random image pool.');
				
				let displayData = candy.makeDisplayData(file);
				if (!displayData.effects || displayData.effects.length === 0) {
					if (candy.winning) {
						displayData.effects = this.config.winEffects;
					} else if (userBonusRewarded) {
						displayData.effects = this.config.bonusEffects;
					}
				}
				
				this.broadcastEvent('dropImage', displayData);
			});
	}
	
	load() {
		// this.onChannelReward(
		// 	'Start a Candy Game',
		// 	user => {
		// 		if (this.enabled) {
		// 			if (!this.startGame(user)) {
		// 				this.tell(
		// 					user,
		// 					"Sorry, like the description says, we can't refund the points for this...");
		// 			}
		// 		}
		// 	}
		// );
	}
	
	// commands = {
	// 	['trickortreat']: {
	// 		name: 'Start Game',
	// 		description: 'Starts a candy game.',
	// 		filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
	// 		callback: user => this.startGame(user),
	// 	},
	//
	// 	['nomorecandy']: {
	// 		name: 'Stop Game',
	// 		description: 'Stops the currently ongoing candy game.',
	// 		filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
	// 		callback: user => this.endGame(user),
	// 	},
	//
	// 	['gimme']: {
	// 		name: 'Drop Candy',
	// 		description: 'Randomly chooses a piece of candy for the user and drops it down from above.',
	// 		cost: 10,
	// 		silent: true,
	// 		cooldowns: {
	// 			user: 3000,
	// 		},
	// 		callback: user => this.candyRequest(user),
	// 	},
	// }
	
	functions = {
		startGame: {
			name: 'Start Game',
			description: 'Starts a candy game.',
			filters: [
				this.filter.oneOfUsers(['fluxistence', 'yecatsmailbox']),
			],
			action: data => this.startGame(data.user),
			triggers: [
				this.trigger.command({
					cmdname: 'trickortreat',
				}),
				this.trigger.reward(),
			],
		},
		
		stopGame: {
			name: 'Stop Game',
			description: 'Stops the currently ongoing candy game.',
			filters: [
				this.filter.oneOfUsers(['fluxistence', 'yecatsmailbox']),
			],
			action: data => this.endGame(data.user),
			triggers: [
				this.trigger.command({
					cmdname: 'nomorecandy',
				}),
			],
		},
		
		dropCandy: {
			name: 'Drop Candy',
			description: 'Randomly chooses a piece of candy for the user and drops it down from above.',
			action: data => this.candyRequest(data.user),
			triggers: [
				this.trigger.command({
					cmdname: 'gimme',
					cost: 10,
					cooldowns: {
						user: 3,
					},
				}),
			],
		},
	}
	
/*
	// noinspection JSUnusedLocalSymbols
	test(invocationData) {
		this.log('This is your testain speaking... All is well!');
		return {
			varvar: 'Wheeeee!',
		}
	}
	
	functions = {
		testTest: {
			name: 'Testy Test',
			description: 'Tests testable tests',
			action: (...p) => this.test(...p),
			// cooldowns: {
			// 	user: 3000,
			// 	// global: 2000,
			// },
			parameters: [
				{
					name: 'First',
					default: 'Hi?'
				},
				{
					name: 'Rest',
					takeAll: true,
				},
			],
			filters: [
				this.filter.isSub(),
			],
			variables: [
				this.variable.out('varvar', {
					name: 'My Variable',
				}),
				this.variable.custom({
					name: 'Something',
					description: 'Another thing',
					example: 'More things',
					expr: '$thing',
					replacement: 'stuff',
				})
			],
			triggers: [
				this.trigger.command({
					cmdname: 'aa',
					// cooldowns: {
					// 	user: 3000,
					// 	// global: 2000,
					// },
					filters: [
						this.filter.oneOfUsers(['fluxistence', 'yecatsmailbox']),
						this.filter.isMod(),
					],
				}),
				this.trigger.shortcut({
					keys: [
						['SHIFT_L', 'SPACE'],
					],
					filters: [
						this.filter.specificUser('fluxistence'),
					],
					// cooldowns: {
					// 	user: 10000,
					// 	// global: 2000,
					// },
				}),
			],
			responses: [
				this.response.console('Hey, it worked!'),
				this.response.console({
					level: 'warn',
					message: 'Blame it on $user: 1: $1 2: $2 3: $3 all: $all.',
				}),
				this.response.console({
					level: 'warn',
					message: 'varvar = $varvar, thing = $thing',
				}),
			],
		},
	}
*/
}

module.exports = new CandyGame();
