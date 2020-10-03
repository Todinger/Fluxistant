'use strict';

const urljoin = require('url-join');
const Effect = require('../../effect');
const Utils = require('../../utils');

const CANDY_FILENAME = 'candy.json';
const START_COMMAND = 'candy';

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

const IMAGE_DEFAULTS = {
	
};

const USERBONUS_DEFAULTS = {
	amount: 500,
};

class CandyGame extends Effect {
	constructor() {
		super({
			name: 'CandyGame',
			tags: ['imgdrop', 'textdisp'], 
		});
		
		this.candyData = {};
		this.ongoing = false;
		this.imageDirURL = null;
	}
	
	dropImage(image) {
		this.broadcastEvent('dropImage', image);
	}
	
	startGame(user) {
		if (this.ongoing) {
			this.tell(user, 'Bad cg!');
			// this.tell(user, 'A candy game is already taking place!');
			return;
		}
		
		this.ongoing = true;
		this.say(`${user.displayName} cg'ed!`);
		// this.say(`${user.displayName} has started a candy game!`);
	}
	
	endGame(user) {
		if (!this.ongoing) {
			this.tell(user, "Bad ce!");
			// this.tell(user, "You can't stop a game that isn't running!");
			return;
		}
		
		this.ongoing = false;
		this.say(`${user.displayName} ce'ed!`);
		// this.say(`Sorry folks, ${user.displayName} has ended the candy game!`);
	}
	
	announceWinner(user) {
		this.broadcastEvent('showText', {
			text: `${user.displayName} wins!`,
			style: 'Creepy',
			color: '#EF8D01',
			duration: 10000,
		});
	}
	
	candyRequest(user) {
		let candyName = Utils.weightedRandomKey(this.candyData, cd => cd.weight);
		let candy = this.candyData[candyName];
		
		let reward = candy.reward;
		if (candy.userBonus) {
			if (candy.userBonus.username.toLowerCase() === user.name.toLowerCase()) {
				reward += candy.userBonus.amount;
			}
		}
		
		this.modifyUserPoints(user, reward);
		
		this.dropImage(candy.image);
		if (candy.winning) {
			this.announceWinner(user);
			this.ongoing = false;
			this.say('A');
		}
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
		this.registerCommand({
			cmdname: 'cg',
			// cmdname: 'trickortreat',
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.startGame(user),
		});
		
		this.registerCommand({
			cmdname: 'ce',
			// cmdname: 'nomorecandy',
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.endGame(user),
		});
		
		this.registerCommand({
			cmdname: 'c',
			// cmdname: 'gimme',
			
			// This makes the command inactive while the game isn't on
			filters: [() => this.ongoing],
			
			cost: 10,
			silent: true,
			
			// cooldowns: {
			// 	user: 3000,
			// },
			
			callback: user => this.candyRequest(user),
		});
	}
}

module.exports = new CandyGame();
