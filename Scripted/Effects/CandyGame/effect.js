'use strict';

const fs = require('fs');
const path = require('path');
const Effect = require('../../effect');

const CANDY_FILENAME = 'candy.json';
const START_COMMAND = 'candy';

class CandyGame extends Effect {
	constructor() {
		super({
			name: 'Candy Game',
			tags: ['imgdrop'], 
		});
		
		this.candyData = {};
		this.ongoing = false;
	}
	
	sendFile(fileurl) {
		this.broadcastEvent('dropImage', { url: fileurl });
	}
	
	startGame(user) {
		if (this.ongoing) {
			this.tell(user, 'A candy game is already taking place!');
			return;
		}
		
		this.ongoing = true;
		this.say(`${user.name} has started a candy game!`)
	}
	
	loadCandyData() {
		try {
			this.candyData = this.readJSON(CANDY_FILENAME);
			this.log('Loaded candy data.');
		} catch (err) {
			this.error('Failed to read candy data:');
			this.error(err);
		}
	}
	
	reloadData() {
		this.loadCandyData();
	}
	
	load() {
		this.registerCommand({
			cmdname: 'candy',
			filters: [Effect.Filters.isOneOf(['yecatsmailbox', 'fluxistence'])],
			callback: user => this.startGame(user),
		});
	}
}

module.exports = new CandyGame();
