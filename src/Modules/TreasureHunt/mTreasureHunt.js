const Module = requireMain('module');
const Utils = requireMain('utils');

const BOARD_SIZE_BOUNDS = {
	width: {
		min: 1,
		max: 10,
	},
	height: {
		min: 1,
		max: 10,
	},
};

const DEFAULT_BOARD_SIZE = {
	width: 3,
	height: 3,
}

const COORDINATE_TYPES = {
	ROW_COL: 1,
	XY: 2,
}

const DEFAULT_START_MESSAGE = '';
const WIN_MESSAGE_USER_PLACEHOLDER = '$winner';
const WIN_MESSAGE_REWARD_PLACEHOLDER = '$reward';
const DEFAULT_WIN_MESSAGE = `Well done! ${WIN_MESSAGE_USER_PLACEHOLDER} has found it and been awarded ${WIN_MESSAGE_REWARD_PLACEHOLDER}!`;
const DEFAULT_RESET_MESSAGE = "Doesn't anybody else want to take a shot? Alright then, guesses are reset! Try again!";

class TreasureHunt extends Module {
	constructor() {
		super({
			name: 'Treasure Hunt',
			webname: 'treasureHunt',
			source: 'treasure.html',
		});
		
		this.initializeGame();
	}
	
	initializeGame() {
		this.size = {
			height: 0,
			width: 0,
		}
		
		this.usersWhoGuessed = [];
		
		if (this.resetTask !== null) {
			clearTimeout(this.resetTask);
		}
		this.resetTask = null;
		
		this.running = false;
	}
	
	defineModConfig(modConfig) {
		modConfig.addNaturalNumber('reward', 1000)
			.setName('Reward')
			.setDescription('Amount of SE points to award the winner');
		modConfig.addDuration('guessesResetTime', 30)
			.setName('Guesses Reset Time')
			.setDescription('Number of seconds without guesses until viewers can enter another guess');
		modConfig.addString('startMessage', DEFAULT_START_MESSAGE)
			.setName('Start Message')
			.setDescription(`The message to show in chat when the game starts`);
		modConfig.addString('resetMessage', DEFAULT_RESET_MESSAGE)
			.setName('Reset Message')
			.setDescription(`The message to show in chat when the guesses are reset and users can guess again`);
		modConfig.addBoolean('enableWinChatMessage', true)
			.setName('Enable Win Message')
			.setDescription('Show a message in the chat announcing the winner');
		modConfig.addString('winChatMessage', DEFAULT_WIN_MESSAGE)
			.setName('Win Message')
			.setDescription(`The message to show in chat when someone wins the game (use ${WIN_MESSAGE_USER_PLACEHOLDER} for the winner's name and ${WIN_MESSAGE_REWARD_PLACEHOLDER} for the amount of points)`);
	}
	
	boardSizeInBounds(height, width) {
		return Utils.inRange(BOARD_SIZE_BOUNDS.height.min, height, BOARD_SIZE_BOUNDS.height.max) &&
			Utils.inRange(BOARD_SIZE_BOUNDS.width.min, width, BOARD_SIZE_BOUNDS.width.max);
	}
	
	startGame(data) {
		let width = DEFAULT_BOARD_SIZE.width;
		let height = DEFAULT_BOARD_SIZE.height;
		if (data.params.length >= 2) {
			let heightStr = data.params[0];
			let widthStr = data.params[1];
			if (!(Utils.isNaturalNumberString(heightStr) && Utils.isNaturalNumberString(widthStr))) {
				this.tellError(data.user, "Please enter positive integers for the board size.");
				return;
			}
			
			height = Number(heightStr);
			width = Number(widthStr);
			if (!this.boardSizeInBounds(height, width)) {
				this.tellError(data.user, `Board size must be in the range [${BOARD_SIZE_BOUNDS.height.min} - ${BOARD_SIZE_BOUNDS.height.max}] x [${BOARD_SIZE_BOUNDS.width.min} - ${BOARD_SIZE_BOUNDS.width.max}].`);
				return;
			}
		}
		
		this.endGame();
		this.size = {height, width};
		this.initializeBoard();
		this.placeTreasure();
		
		this.broadcastEvent('initGame', this.size);
		
		let startMessage = this.config.startMessage.trim();
		if (startMessage.length > 0) {
			this.say(startMessage);
		}
		
		this.running = true;
	}
	
	initializeBoard() {
		this.cellsGuessed = Utils.createArray(this.size.height, this.size.width);
		for (let row = 0; row < this.size.height; row++) {
			for (let col = 0; col < this.size.width; col++) {
				this.cellsGuessed[row][col] = false;
			}
		}
	}
	
	placeTreasure() {
		this.treasureLocation = {
			row: Utils.randomInt(1, this.size.height + 1),
			col: Utils.randomInt(1, this.size.width + 1),
		};
	}
	
	endGame() {
		this.initializeGame();
	}
	
	cellInBoard(row, col) {
		return Utils.inRange(1, row, this.size.height) &&
			   Utils.inRange(1, col, this.size.width);
	}
	
	tellGuessUsage(user, type) {
		try {
			let lastCell = this.size.width * this.size.height;
			if (type === COORDINATE_TYPES.XY) {
				let cmdname = this.funcObjects.guessxy.triggers[0].cmdname;
				this.tell(user, `Usage: "!${cmdname} x y" ([1 - ${this.size.width}], [1 - ${this.size.height}])`);
			} else {
				let cmdname = this.funcObjects.guess.triggers[0].cmdname;
				this.tell(user, `Usage: "!${cmdname} CellNum" (1 - ${lastCell}) OR "!${cmdname} row col" ([1 - ${this.size.height}], [1 - ${this.size.width}])`);
			}
		} catch {} // If we don't have a command trigger, show nothing
	}
	
	getGuessParameter(paramString, minLimit, maxLimit, limitErrorMessage) {
		if (!Utils.isNaturalNumberString(paramString)) {
			throw "Please enter positive integers for the cell selection.";
		}
		
		let param = Number(paramString);
		if (param < minLimit || maxLimit < param) {
			throw limitErrorMessage;
		}
		
		return param;
	}
	
	getGuessCellNumber(paramString) {
		let lastCell = this.size.width * this.size.height;
		return this.getGuessParameter(paramString, 1, lastCell, `That's outside the board! Please enter a number between 1 - ${lastCell}.`)
	}
	
	getGuessRowColCoordinate(paramString, minLimit, maxLimit) {
		return this.getGuessParameter(paramString, minLimit, maxLimit, `That's outside the board! Please enter a location inside [1 - ${this.size.height}], [1 - ${this.size.width}].`);
	}
	
	getGuessRowCoordinate(paramString) {
		return this.getGuessRowColCoordinate(paramString, 1, this.size.height);
	}
	
	getGuessColCoordinate(paramString) {
		return this.getGuessRowColCoordinate(paramString, 1, this.size.width);
	}
	
	getGuessXYCoordinate(paramString, minLimit, maxLimit) {
		return this.getGuessParameter(paramString, minLimit, maxLimit, `That's outside the board! Please enter a location inside [1 - ${this.size.width}], [1 - ${this.size.height}].`);
	}
	
	getGuessXCoordinate(paramString) {
		return this.getGuessRowColCoordinate(paramString, 1, this.size.height);
	}
	
	getGuessYCoordinate(paramString) {
		return this.getGuessRowColCoordinate(paramString, 1, this.size.width);
	}
	
	parseGuess(data, type) {
		if (!this.running) {
			return false;
		}
		
		if (this.usersWhoGuessed.includes(data.user.name)) {
			this.tellError(data.user, "Sorry, you've already guessed once this phase.");
			return false;
		}
		
		// Remove commas and x's in coordinate form
		let allParams = data.params.join(' ').replace(/[.,x]/g, ' ').replace(/[()]/g, '');
		let splitParams = allParams.split(/\s+/).filter(paramString => paramString !== "");
		
		let row = 0, col = 0;
		
		try {
			if (splitParams.length === 0) {
				this.tellGuessUsage(data.user, type);
				return false;
			} else if (splitParams.length === 1) {
				if (type === COORDINATE_TYPES.XY) {
					this.tellGuessUsage(data.user, type);
					return false;
				}
				
				let num = this.getGuessCellNumber(splitParams[0]) - 1;
				row = Math.floor(num / this.size.width) + 1;
				col = num % this.size.width + 1;
			} else {
				if (type === COORDINATE_TYPES.XY) {
					col = this.getGuessXCoordinate(splitParams[0]);
					row = this.size.height + 1 - this.getGuessYCoordinate(splitParams[1]);
				} else {    // Defaults to COORDINATE_TYPES.ROW_COL
					row = this.getGuessRowCoordinate(splitParams[0]);
					col = this.getGuessColCoordinate(splitParams[1]);
				}
			}
		} catch (msg) {
			this.tellError(data.user, msg);
			return false;
		}
		
		if (this.cellsGuessed[row - 1][col - 1]) {
			this.tellError(data.user, `That location has already been checked - try somewhere else! =)`);
			return false;
		}
		
		return {row, col};
	}
	
	isTreasure(row, col) {
		return this.treasureLocation.row === row &&
			   this.treasureLocation.col === col;
	}
	
	processWin(user) {
		this.modifyUserPoints(user, this.config.reward).then().catch();
		if (this.config.enableWinChatMessage) {
			let message = this.config.winChatMessage;
			message = message.replace(WIN_MESSAGE_USER_PLACEHOLDER, user.displayName);
			message = message.replace(WIN_MESSAGE_REWARD_PLACEHOLDER, this.pointsString(this.config.reward));
			this.say(message);
		}
	}
	
	resetGuesses() {
		this.usersWhoGuessed = [];
		this.say(this.config.resetMessage);
	}
	
	guess(data, type) {
		let guess = this.parseGuess(data, type);
		if (!guess) {
			return;
		}
		
		this.cellsGuessed[guess.row - 1][guess.col - 1] = true;
		let cellState = 'miss';
		if (this.isTreasure(guess.row, guess.col)) {
			cellState = 'hit';
			this.processWin(data.user);
			this.endGame();
		} else {
			this.usersWhoGuessed.push(data.user.name);
			if (this.resetTask !== null) {
				clearTimeout(this.resetTask);
			}
			
			this.resetTask = setTimeout(() => this.resetGuesses(), this.config.guessesResetTime);
		}
		
		this.broadcastEvent('setState', {
			row: guess.row,
			col: guess.col,
			state: cellState,
		});
	}
	
	reveal() {
		if (!this.running) {
			return;
		}
		
		this.endGame();
		this.broadcastEvent('setState', {
			row: this.treasureLocation.row,
			col: this.treasureLocation.col,
			state: 'hit',
		});
	}
	
	hide() {
		if (this.running) {
			this.endGame();
		}
		
		this.broadcastEvent('hide');
	}
	
	makeStatesArray() {
		let states = [];
		for (let row = 0; row < this.size.height; row++) {
			for (let col = 0; col < this.size.width; col++) {
				if (this.cellsGuessed[row][col]) {
					let cellData = {
						row: row + 1,
						col: col + 1,
					};
					
					if (this.isTreasure(row + 1, col + 1)) {
						cellData.state = 'hit';
					} else {
						cellData.state = 'miss';
					}
					
					states.push(cellData);
				}
			}
		}
		
		return states;
	}
	
	load() {
		this.onClientAttached(socket => {
			socket.on('error', err => {
				this.error(err);
			});
			
			if (this.running) {
				socket.emit('boardState', {
					height: this.size.height,
					width: this.size.width,
					states: this.makeStatesArray(),
				});
			}
		});
	}
	
	functions = {
		start: {
			name: 'Start Game',
			description: 'Starts a treasure hunt game',
			triggers: [
				this.trigger.command({
					cmdname: 'treasure',
				}),
			],
			action: data => this.startGame(data),
		},
		guess: {
			name: 'Guess Location',
			description: 'Searches for the treasure at the given location',
			triggers: [
				this.trigger.command({
					cmdname: 'peek',
				}),
			],
			action: data => this.guess(data, COORDINATE_TYPES.ROW_COL),
		},
		guessxy: {
			name: 'Guess Location: X, Y',
			description: 'Searches for the treasure at the given mathematical coordinate',
			triggers: [
				this.trigger.command({
					cmdname: 'peekxy',
				}),
			],
			action: data => this.guess(data, COORDINATE_TYPES.XY),
		},
		reveal: {
			name: 'Reveal',
			description: 'Ends the game and shows the treasure',
			triggers: [
				this.trigger.command({
					cmdname: 'reveal',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
			action: () => this.reveal(),
		},
		end: {
			name: 'End Game',
			description: 'Ends the treasure hunt game and hides it',
			triggers: [
				this.trigger.command({
					cmdname: 'endtreasure',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
			action: () => this.hide(),
		},
	}
}

module.exports = new TreasureHunt();
