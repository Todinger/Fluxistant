const Module = requireMain('module');
const Utils = requireMain('utils');

const States = {
	Inactive: 0,
	Recruiting: 1,
	Ongoing: 2,
}

const { TrackManager } = require('./tracks.js');

const DistanceFunctions = {
	Linear: (multiplier, addition) => (force) => multiplier * force + addition,
	RandomizedLinear: (minMultiplier, maxMultiplier, minAddition, maxAddition) => (force) =>
		Utils.randomRange(minMultiplier, maxMultiplier) * force + Utils.randomRange(minAddition, maxAddition),
	RandomizedExponential: (minExp, maxExp, minMultiplier, maxMultiplier, minAddition, maxAddition) => function(force) {
		let exponent = Utils.randomRange(minExp, maxExp);
		let multiplier = Utils.randomRange(minMultiplier, maxMultiplier);
		let addition = Utils.randomRange(minAddition, maxAddition);
		return Math.sign(force) * multiplier * Math.pow(Math.abs(force), exponent) + addition;
	},
}

class Golf extends Module {
	constructor() {
		super({
			name:    'Golf',
			webname: 'golf',
			source:  'golf.html',
			debug: true,
		});
		
		this.data.records = {};
		this.state = States.Inactive;
		this.stateTimer = null;
		this.activeGame = null;
		this.reminderTimer = null;
		this.cancelTimer = null;
		
		this.calculateDistanceFromForce = DistanceFunctions.RandomizedExponential(
			2.5,
			3.2,
			0.6,
			1.4,
			1,
			3);
	}
	
	defineModConfig(modConfig) {
		modConfig.addString('recruitText', 'A golf game is starting - type !tee to join!')
		.setName('Recruitment Text')
		.setDescription('What will be written to the chat when a game is initiated and players can start joining' +
						` (vars - ${this.listVariables()})`);
		modConfig.addDuration('recruitTime', 30)
		.setName('Recruitment Time')
		.setDescription('How long (in seconds) people have to join a game');
		modConfig.addString(
			'trackStartText',
			'A new match has started on $track with $players player(s)! Distance to hole: $distance')
		.setName('Start Text')
		.setDescription('What will be written to the chat when a game starts' +
						` (vars - ${this.listVariables()})`);
		
		modConfig.addDuration('reminderInterval', 30)
		.setName('Swing Reminder Interval')
		.setDescription(
			'How often (in seconds) to reminder players to swing when the game is idle (set to 0 to disable)');
		modConfig.addString('reminderText', 'There are lonely golf balls here just begging for some attention.')
		.setName('Reminder Text')
		.setDescription('What will be written to chat to remind players to play.' +
			` (vars - ${this.listVariables()})`);
		modConfig.addDuration('gameTimeout', 300)
		.setName('Game Timeout')
		.setDescription('How long (in seconds) without activity before the game is canceled (set to 0 to disable)');
		modConfig.addString('cancelText', 'The golf balls have had enough and have retired to their quarters.')
		.setName('Cancellation Text')
		.setDescription('What will be written to chat when the game is aborted due to timeout.' +
			` (vars - ${this.listVariables()})`);
		
		modConfig.addNaturalNumber('maxStrokes', 10)
		.setName('Stroke Count')
		.setDescription('Maximum number of strokes each player has');
		modConfig.addNaturalNumber('pointsForScoring', 1000)
		.setName('Points for Scoring')
		.setDescription('Upon scoring, how many base points to award the player');
		modConfig.addNaturalNumber('pointsPerStrokeLeft', 100)
		.setName('Bonus Points per Stroke Left')
		.setDescription('Upon scoring, how many extra points to award the player per stroke they have left');
		
		modConfig.addPositiveNumber('maxForce', 10)
		.setName('Maximum Force')
		.setDescription('Maximum allowed force value on a swing');
		modConfig.addNonNegativeNumber('leniency', 2)
		.setName('Leniency')
		.setDescription('How close to the hole is considered "in"');
		
		modConfig.addString(
			'scoreMessage',
			'Right into the hole it goes! $user wins $award cat toys for a total of $points!')
		.setName('Score Message')
		.setDescription('What will be written to a player in the chat when they get the ball into the hole' +
						` (vars - $strokes, $left, $user, $award, $points, ${this.listVariables()})`);
		modConfig.addString(
			'missMessage',
			"Oh no, where are you going?! Well, now you're $distance away with $left strokes left.")
		.setName('Miss Message')
		.setDescription('What will be written to a player in the chat when they miss the hole' +
						` (vars - $distance, $strokes, $left, ${this.listVariables()})`);
		
		let swingPhysics = modConfig.addGroup('swingPhysics')
		.setName('Swing Physics')
		.setDescription('Parameters for deciding how far the ball goes based on swing force' +
						' (final distance = multiplier * force ^ exponent + addition)');
		
		swingPhysics.addPositiveNumber('minExp', 2.5)
		.setName('Minimum Exponent')
		.setDescription('Minimum value to raise the force to the power of');
		swingPhysics.addPositiveNumber('maxExp', 3.2)
		.setName('Maximum Exponent')
		.setDescription('Maximum value to raise the force to the power of');
		swingPhysics.addNumber('minMultiplier', 0.6)
		.setName('Minimum Multiplier')
		.setDescription('Minimum amount to multiply the force by');
		swingPhysics.addNumber('maxMultiplier', 1.4)
		.setName('Maximum Multiplier')
		.setDescription('Maximum amount to multiply the force by');
		swingPhysics.addNumber('minAddition', -2)
		.setName('Minimum Addition')
		.setDescription('Minimum amount to add to the total distance');
		swingPhysics.addNumber('maxAddition', 2)
		.setName('Maximum Addition')
		.setDescription('Maximum amount to add to the total distance');
		
		modConfig.addDynamicArray('tracks', 'Track')
		.setName('Tracks')
		.setDescription('The golf tracks available in the game');
		
		let mediaConfig = modConfig.addGroup('media')
		.setName('Media Files')
		.setDescription('The images, sounds and videos to show for the various swinging poses');
		mediaConfig.add('backSwing', 'SingleMedia')
		.setName('Back Swing')
		.setDescription('Media for the holding the golf club backwards');
		mediaConfig.add('atBall', 'SingleMedia')
		.setName('At Ball')
		.setDescription('Media for the holding the golf club next to the ball');
		mediaConfig.add('swing', 'SingleMedia')
		.setName('Swing')
		.setDescription('Media for swinging forward after hitting the ball');
		mediaConfig.add('score', 'SingleMedia')
		.setName('Score')
		.setDescription('Media for scoring (ball in hole)');
		mediaConfig.add('miss', 'SingleMedia')
		.setName('Miss')
		.setDescription('Media for missing (ball outside hole)');
	}
	
	validateRange(lower, upper, name) {
		if (lower > upper) {
			throw `Minimum ${name} must be <= maximum ${name}.`;
		}
	}
	
	loadModConfig(conf) {
		this.validateRange(conf.swingPhysics.minExp, conf.swingPhysics.maxExp, "Exponent");
		this.validateRange(conf.swingPhysics.minMultiplier, conf.swingPhysics.maxMultiplier, "Multiplier");
		this.validateRange(conf.swingPhysics.minAddition, conf.swingPhysics.maxAddition, "Addition");
		
		TrackManager.clearTracks();
		TrackManager.loadTracks(conf.tracks);
		this.calculateDistanceFromForce = DistanceFunctions.RandomizedExponential(
			conf.swingPhysics.minExp,
			conf.swingPhysics.maxExp,
			conf.swingPhysics.minMultiplier,
			conf.swingPhysics.maxMultiplier,
			conf.swingPhysics.minAddition,
			conf.swingPhysics.maxAddition);
	}
	
	disable() {
		this.stopGame();
	}
	
	get activeTrackName() {
		return this.activeGame !== null ? this.activeGame.track.name : "";
	}
	
	get activeTrackLength() {
		return this.activeGame !== null ? this.activeGame.track.length : 0;
	}
	
	get activePlayerCount() {
		return this.activeGame !== null ? Object.keys(this.activeGame.players).length : 0;
	}
	
	createUserData(user) {
		this.data.records[user.name] = {
			strokes: 0,
			games: 0,
			wins: 0,
		};
	}
	
	setNewGameData() {
		this.activeGame = {
			players: {},  // Map of user name to player state in the game
			track: TrackManager.getRandomTrack(),
			playersWithStrokesLeft: 0,
		}
		
		this.maxStrokes = this.config.maxStrokes;
	}
	
	
	startTimedState(state, duration, startMessage, onTimeOut) {
		this.state = state;
		this.compileSay(startMessage);
		this.stateTimer = setTimeout(
			() => {
				this.stateTimer = null;
				onTimeOut();
			},
			duration);
	}
	
	cancelGameTimers() {
		if (this.reminderTimer) {
			clearTimeout(this.reminderTimer);
			this.reminderTimer = null;
		}
		if (this.cancelTimer) {
			clearTimeout(this.cancelTimer);
			this.cancelTimer = null;
		}
	}
	
	cancelTimers() {
		if (this.stateTimer) {
			clearTimeout(this.stateTimer);
			this.stateTimer = null;
		}
		
		this.cancelGameTimers();
	}
	
	resetGameTimers() {
		this.cancelGameTimers();
		this.startReminderTimer();
		this.startCancelTimer();
	}
	
	remindPlayers() {
		this.compileSay(this.config.reminderText);
		this.startReminderTimer();
	}
	
	startReminderTimer() {
		if (this.config.reminderInterval > 0) {
			this.reminderTimer = setTimeout(
				() => this.remindPlayers(),
				this.config.reminderInterval
			)
		}
	}
	
	cancelGame() {
		this.compileSay(this.config.cancelText);
		this.stopGame();
	}
	
	startCancelTimer() {
		if (this.config.gameTimeout > 0) {
			this.cancelTimer = setTimeout(
				() => this.cancelGame(),
				this.config.gameTimeout
			)
		}
	}
	
	stopGame() {
		if (this.state !== States.Inactive) {
			this.cancelTimers();
			this.activeGame = null;
			this.state = States.Inactive;
		}
	}
	
	addUserToGame(user) {
		if (this.activeGame && !(user.name in this.activeGame.players)) {
			this.activeGame.players[user.name] = {
				displayName: user.displayName,
				position: 0,
				strokes: 0,
			};
			if (!(user.name in this.data.records)) {
				this.createUserData(user);
			}
		}
	}
	
	startRecruiting(data) {
		if (this.state !== States.Inactive) return false;
		if (!TrackManager.hasTracks) {
			this.tellError(
				data.user,
				'Sorry, all the golf tracks are still under constructions. Please come back later.')
			return false;
		}
		
		this.setNewGameData();
		this.addUserToGame(data.user);
		this.startTimedState(
			States.Recruiting,
			this.config.recruitTime,
			this.config.recruitText,
			() => this.startTrack())
	}
	
	startTrack() {
		this.state = States.Ongoing;
		this.activeGame.playersWithStrokesLeft = Object.keys(this.activeGame.players).length;
		this.compileSay(this.config.trackStartText);
		this.startReminderTimer();
		this.startCancelTimer();
	}
	
	join(data) {
		if (this.state !== States.Recruiting) {
			if (this.state === States.Ongoing) {
				this.tellError(data.user, "The game has already started; it's too late to join it now.")
			}
			
			return false;
		}
		
		this.addUserToGame(data.user);
	}
	
	calculateProximity(userGameRecord) {
		return Math.abs(userGameRecord.position - this.activeGame.track.length)
	}
	
	async swing(data) {
		if (this.state !== States.Ongoing || !(data.user.name in this.activeGame.players)) return false;
		
		let user = data.user;
		let userGameRecord = this.activeGame.players[user.name];
		if (userGameRecord.strokes === this.maxStrokes) return;
		
		this.resetGameTimers();
		
		let force = data.firstParam;
		if (Number.isNaN(force) || !Utils.inRange(-this.config.maxForce, force, this.config.maxForce)) {
			this.tellError(
				user,
				`Please enter a number in the range [${-this.config.maxForce}, ${this.config.maxForce}].`);
			return;
		}
		
		let distance = this.calculateDistanceFromForce(force);
		userGameRecord.position += distance;
		let proximity = this.calculateProximity(userGameRecord);
		userGameRecord.strokes++;
		if (proximity <= this.config.leniency) {
			userGameRecord.position = this.activeGame.track.length;
			this.activeGame.playersWithStrokesLeft--;
			await this.playerScored(user, userGameRecord);
		} else {
			this.playerMissed(user, userGameRecord);
			if (userGameRecord.strokes === this.maxStrokes) {
				this.activeGame.playersWithStrokesLeft--;
			}
		}
		
		this.checkEndOfGame();
	}
	
	checkEndOfGame() {
		if (this.activeGame.playersWithStrokesLeft === 0) {
			this.gameFinished();
		}
	}
	
	variablesFromUserGameRecord(userGameRecord) {
		return {
			distance: (this.activeGame.track.length - userGameRecord.position).toFixed(2),
			strokes: userGameRecord.strokes,
			left: this.maxStrokes - userGameRecord.strokes,
		};
	}
	
	async playerScored(user, userGameRecord) {
		let strokesLeft = this.maxStrokes - userGameRecord.strokes;
		let award = this.config.pointsForScoring + this.config.pointsPerStrokeLeft * strokesLeft;
		let points = await this.modifyUserPoints(user, award);
		if (points !== null) {
			let vars = this.variablesFromUserGameRecord(userGameRecord);
			vars = {
				...vars,
				award,
				points,
				user: user.displayName,
			}
			this.compileTell(user, this.config.scoreMessage, vars);
		}
	}
	
	playerMissed(user, userGameRecord) {
		this.compileTell(user, this.config.missMessage, this.variablesFromUserGameRecord(userGameRecord));
	}
	
	comparePlayerGameRecords(record1, record2) {
		let proximity1 = this.calculateProximity(record1);
		let proximity2 = this.calculateProximity(record2);
		if (proximity1 !== proximity2) {
			return proximity1 - proximity2;
		}
		
		return record1.strokes - record2.strokes;
	}
	
	playerResult(username) {
		let userGameRecord = this.activeGame.players[username];
		let proximity = this.calculateProximity(userGameRecord);
		return `${userGameRecord.displayName} (distance: ${proximity}, strokes: ${userGameRecord.strokes})`
	}
	
	gameFinished() {
		this.saveGameResultsToData();
		let sortedPlayers = Object.keys(this.activeGame.players).sort(
			(record1, record2) => this.comparePlayerGameRecords(record1, record2));
		let topPlayers = sortedPlayers.slice(0, 3).map(username => this.playerResult(username));
		this.say(`Game finished! Top player(s): ${topPlayers.join(", ")}`);
		
		this.stopGame();
	}
	
	saveGameResultsToData() {
		Object.keys(this.activeGame.players).forEach(username => {
			let userGameRecord = this.activeGame.players[username];
			let userDataRecord = this.data.records[username];
			if (userGameRecord.position === this.activeGame.track.length) {
				userDataRecord.wins++;
			}
			
			userDataRecord.games++;
			userDataRecord.strokes += userGameRecord.strokes;
		});
		
		this.saveData();
	}
	
	
	functions = {
		start: {
			name:        'Start Game',
			description: 'Starts a new golf game',
			action:      data => this.startRecruiting(data),
			triggers:    [
				this.trigger.command({
					cmdname: 'golf',
				}),
			],
		},
		join: {
			name:        'Join Game',
			description: 'Joins an ongoing golf game during the joining phase',
			action:      data => this.join(data),
			triggers:    [
				this.trigger.command({
					cmdname: 'tee',
				}),
			],
		},
		swing: {
			name:        'Swing',
			description: "Hit the ball on the player's turn",
			action:      async (data) => this.swing(data),
			triggers:    [
				this.trigger.command({
					cmdname: 'swing',
				}),
			],
		},
		stop: {
			name:        'End Game',
			description: 'Ends the currently active game, no matter what stage it is in',
			action:      () => this.stopGame(),
			filters: [
				this.filter.isMod()
			],
			triggers:    [
				this.trigger.command({
					cmdname: 'flog',
				}),
			],
		},
	}
	
	variables = [
		this.variable.getter('track', {
			name: 'Track Name (`track`)',
			description: 'Name of the currently active track',
			example: '"There are high winds today at track..." ---When the track is "Windy Hills"---> "There are high winds today at Windy Hills..."',
			expr: '$track',
			getter: () => this.activeTrackName,
		}),
		this.variable.getter('length', {
			name: 'Track Length (`$length`)',
			description: 'Length of the currently active track',
			example: '"This track is $length yards long!" ---When the track length is 500---> "This track is 500 yards long"',
			expr: '$length',
			getter: () => this.activeTrackLength,
		}),
		this.variable.getter('players', {
			name: 'Player Count (`$players`)',
			description: 'The number of currently active players in the game',
			example: '"Any one of the $players players can win!" ---When there are 4 players---> "Any one of the 4 players can win!"',
			expr: '$players',
			getter: () => this.activePlayerCount,
		}),
	]
}

module.exports = new Golf();
