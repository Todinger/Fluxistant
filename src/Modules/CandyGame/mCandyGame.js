'use strict';

const urljoin = require('url-join');
const Module = requireMain('module');
const Utils = requireMain('utils');

// File structure:
// 	{
// 		"CandyName"
// 	}
const CANDY_FILENAME = 'candy.json';

const CANDY_DEFAULTS = {
	weight: 25,
	reward: 50,
	image: {
		width: 100,
		height: 100,
	},
	userBonus: {
		amount: 500,
	},
};

const INFLATIONS = {
	none:			()		 =>	(start)       => start,
	linear:			(weight) =>	(start, step) => start + step * weight,
	exponential:	(base)   =>	(start, step) => start * (base ** step),
}

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
			name: 'CandyGame',
			tags: ['imgdrop', 'textdisp'], 
		});
		
		this.candyDefaults = {};
		
		this.candyData = {};
		this.ongoing = false;
		this.imageDirURL = null;
		
		this.winningWeightInflation = INFLATIONS.linear(5);
		this.candyCount = 0;
	}
	
	
	defineModConfig(modConfig) {
		modConfig.add('candyInflation', 'CandyInflation')
			.setName('Candy Inflation')
			.setDescription('Optional inflation of win chances to control the length of the game');
	
/*		// TODO: Switch defaults to config system after implementing data system with image selection
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
		defs.addInteger('userBonus')
			.setName('User Bonus')
			.setDescription('Reward for a user finding their own special candy');
*/
	}
	
	loadModConfig(conf) {
		if (conf.candyInflation && conf.candyInflation.type) {
			let inflationFuncMaker = INFLATIONS[conf.candyInflation.type];
			let inflationValue = conf.candyInflation.argument;
			this.winningWeightInflation = inflationFuncMaker(inflationValue);
		}
	
/*      // TODO: Switch defaults to config system after implementing data system with image selection
		this.candyDefaults = {
			weight: conf.weight,
			reward: conf.reward,
			image: {
				width: conf.imageWidth,
				height: conf.imageHeight,
			},
			userBonus: {
				amount: conf.userBonus,
			},
		};
*/
	}
	
	// Sends the given image parameters to the Image Display Module client for
	// display
	dropImage(image) {
		this.broadcastEvent('dropImage', image);
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
	
	getCandyWeight(candy) {
		if (candy.winning) {
			// noinspection UnnecessaryLocalVariableJS
			let weight = this.winningWeightInflation(
				candy.weight,
				this.candyCount);
			return weight;
		} else {
			return candy.weight;
		}
	}
	
	candyRequest(user) {
		if (!this.ongoing) {
			return;
		}
		
		let candyName = Utils.weightedRandomKey(
			this.candyData,
			candy => this.getCandyWeight(candy));
		let candy = this.candyData[candyName];
		this.candyCount++;
		
		let reward = candy.reward;
		let userBonusRewarded = false;
		if (candy.userBonus) {
			if (candy.userBonus.username.toLowerCase() === user.name.toLowerCase()) {
				reward += candy.userBonus.amount;
				userBonusRewarded = true;
			}
		}
		
		this.modifyUserPoints(user, reward);
		
		let imageData = Utils.clone(candy.image);
		
		if (candy.winning || userBonusRewarded) {
			imageData.effect = 'glow';
		}
		
		if (candy.winning) {
			this.ongoing = false;
			this.announceWinner(user);
		}
		
		this.dropImage(imageData);
	}
	
	preload() {
		this.imageDirURL = this.registerAssetDir('Images', 'images');
	}
	
	loadData() {
		try {
			this.candyData = this.readJSON(CANDY_FILENAME);
			Object.values(this.candyData).forEach(cd => {
				cd.image.url = urljoin(this.imageDirURL, cd.image.url);
				Utils.applyDefaults(cd, CANDY_DEFAULTS);
			});
			
			this.log('Loaded candy data.');
			
		} catch (err) {
			this.error('Failed to read candy data:');
			this.error(err);
		}
	}
	
	load() {
		this.onChannelReward(
			'Start a Candy Game',
			user => {
				if (!this.startGame(user)) {
					this.tell(
						user,
						"Sorry, like the description says, we can't refund the points for this...");
				}
			}
		);
	}
	
	commands = {
		['trickortreat']: {
			name: 'Start Game',
			description: 'Starts a candy game.',
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: user => this.startGame(user),
		},
		
		['nomorecandy']: {
			name: 'Stop Game',
			description: 'Stops the currently ongoing candy game.',
			filters: [this.filterDesc('isOneOf', ['yecatsmailbox', 'fluxistence'])],
			callback: user => this.endGame(user),
		},
		
		['gimme']: {
			name: 'Drop Candy',
			description: 'Randomly chooses a piece of candy for the user and drops it down from above.',
			cost: 10,
			silent: true,
			cooldowns: {
				user: 3000,
			},
			callback: user => this.candyRequest(user),
		},
	}
}

module.exports = new CandyGame();
