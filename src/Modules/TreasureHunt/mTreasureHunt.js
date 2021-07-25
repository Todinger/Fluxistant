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

class TreasureHunt extends Module {
	constructor() {
		super({
			name: 'Treasure Hunt',
			webname: 'treasureHunt',
			source: 'treasure.html',
		});
		
		this.endGame();
	}
	
	boardSizeInBounds(height, width) {
		return Utils.inRange(BOARD_SIZE_BOUNDS.height.min, height, BOARD_SIZE_BOUNDS.height.max) &&
			Utils.inRange(BOARD_SIZE_BOUNDS.width.min, width, BOARD_SIZE_BOUNDS.width.max);
	}
	
	startGame(data) {
		if (data.params.length < 2) {
			this.tellError(data.user, "Please specify both height and width for the treasure hunt.");
			return;
		}
		
		let heightStr = data.params[0];
		let widthStr = data.params[1];
		if (!(Utils.isNaturalNumberString(heightStr) && Utils.isNaturalNumberString(widthStr))) {
			this.tellError(data.user, "Please enter positive integers for the board size.");
			return;
		}
		
		let height = Number(heightStr);
		let width = Number(widthStr);
		if (!this.boardSizeInBounds(height, width)) {
			this.tellError(data.user, `Board size must be in the range [${BOARD_SIZE_BOUNDS.height.min} - ${BOARD_SIZE_BOUNDS.height.max}] x [${BOARD_SIZE_BOUNDS.width.min} - ${BOARD_SIZE_BOUNDS.width.max}].`);
			return;
		}
		
		this.size = {height, width};
		this.initializeBoard();
		this.placeTreasure();
		
		this.broadcastEvent('initGame', this.size);
		
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
			row: Utils.randomInt(1, this.size.height),
			col: Utils.randomInt(1, this.size.width),
		};
	}
	
	endGame() {
		this.size = {
			height: 0,
			width: 0,
		}
		
		this.usersWhoGuessed = [];
		
		this.running = false;
	}
	
	cellInBoard(row, col) {
		return Utils.inRange(1, row, this.size.height) &&
			   Utils.inRange(1, col, this.size.width);
	}
	
	parseGuess(data) {
		if (!this.running) {
			return false;
		}
		
		if (this.usersWhoGuessed.includes(data.user.name)) {
			this.tellError(data.user, "Sorry, you've already guessed once this game.");
			return false;
		}
		
		let rowStr = data.params[0];
		let colStr = data.params[1];
		if (!(Utils.isNaturalNumberString(rowStr) && Utils.isNaturalNumberString(colStr))) {
			this.tellError(data.user, "Please enter positive integers for the cell location.");
			return false;
		}
		
		let row = Number(rowStr);
		let col = Number(colStr);
		if (!this.cellInBoard(row, col)) {
			this.tellError(data.user, `That's outside the board! Please enter a location inside [1 - ${this.size.height}], [1 - ${this.size.width}].`);
			return false;
		}
		
		if (this.cellsGuessed[row - 1][col - 1]) {
			this.tellError(data.user, `That location has already been dug up - try somewhere else! =)`);
			return false;
		}
		
		return {row, col};
	}
	
	isTreasure(row, col) {
		return this.treasureLocation.row === row &&
			   this.treasureLocation.col === col;
	}
	
	guess(data) {
		let guess = this.parseGuess(data);
		if (!guess) {
			return;
		}
		
		this.cellsGuessed[guess.row - 1][guess.col - 1] = true;
		let cellState = 'miss';
		if (this.isTreasure(guess.row, guess.col)) {
			cellState = 'hit';
			this.endGame();
		} else {
			this.usersWhoGuessed.push(data.user.name);
		}
		
		this.broadcastEvent('setState', {
			row: guess.row,
			col: guess.col,
			state: cellState
		});
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
					cmdname: 'dig',
				}),
			],
			action: data => this.guess(data),
		},
	}
}

module.exports = new TreasureHunt();
