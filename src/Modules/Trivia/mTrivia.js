const axios = require('axios');
const _ = require('lodash');
const he = require('he');
const Module = requireMain('module');
const ConfigSourceManager = requireMain('configSourceManager');
const Timers = requireMain('timers');
const Errors = requireMain('errors');
const Utils = requireMain('utils');

const REQUEST_TIMEOUT = 5000;
const MAX_QUESTIONS_PER_REQUEST = 50;
const MAX_FETCH_ATTEMPTS = 10;

const DEFAULT_MAX_QUESTIONS_PER_ROUND = 50;

const DIFFICULTIES_SOURCE_NAME = 'Trivia.Difficulties';
const DIFFICULTIES = {
	['Any']: "",
	['Easy']: "&difficulty=easy",
	['Medium']: "&difficulty=medium",
	['Hard']: "&difficulty=hard",
}
const DIFFICULTY_KEYWORDS = {
	['Easy']: ['Easy'],
	['Medium']: ['Medium'],
	['Hard']: ['Hard', 'Difficult'],
}
const DIFFICULTY_DATA = {
	options: DIFFICULTIES,
	keywords: DIFFICULTY_KEYWORDS,
};

const CATEGORIES_SOURCE_NAME = 'Trivia.Categories';
const CATEGORIES = {
	["Any"]: "",
	["Animals"]: "&category=27",
	["Art"]: "&category=25",
	["Celebrities"]: "&category=26",
	["Entertainment: Board Games"]: "&category=16",
	["Entertainment: Books"]: "&category=10",
	["Entertainment: Cartoon & Animations"]: "&category=32",
	["Entertainment: Comics"]: "&category=29",
	["Entertainment: Film"]: "&category=11",
	["Entertainment: Japanese Anime & Manga"]: "&category=31",
	["Entertainment: Music"]: "&category=12",
	["Entertainment: Musicals & Theatres"]: "&category=13",
	["Entertainment: Television"]: "&category=14",
	["Entertainment: Video Games"]: "&category=15",
	["General Knowledge"]: "&category=9",
	["Geography"]: "&category=22",
	["History"]: "&category=23",
	["Mythology"]: "&category=20",
	["Politics"]: "&category=24",
	["Science & Nature"]: "&category=17",
	["Science: Computers"]: "&category=18",
	["Science: Gadgets"]: "&category=30",
	["Science: Mathematics"]: "&category=19",
	["Sports"]: "&category=21",
	["Vehicles"]: "&category=28",
}
const CATEGORY_KEYWORDS = {
	["Animals"]: ['Animals', 'Animal'],
	["Art"]: ['Art'],
	["Celebrities"]: ['Celebrities', 'Celebs'],
	["Entertainment: Board Games"]: ['Board Games'],
	["Entertainment: Books"]: ['Books', 'Book'],
	["Entertainment: Cartoon & Animations"]: ['Cartoons', 'Cartoon', 'Animations', 'Animation'],
	["Entertainment: Comics"]: ['Comics', 'Comic'],
	["Entertainment: Film"]: ['Movies', 'Movie', 'Films', 'Film'],
	["Entertainment: Japanese Anime & Manga"]: ['Anime', 'Animes', 'Manga', 'Mangas'],
	["Entertainment: Music"]: ['Music', 'Songs', 'Song'],
	["Entertainment: Musicals & Theatres"]: ['Musicals', 'Musical', 'Theatres', 'Theatre', 'Theaters', 'Theater'],
	["Entertainment: Television"]: ['TV', 'T.V.', 'T.V', 'Television'],
	["Entertainment: Video Games"]: ['Video Games', 'Video Game', 'Games', 'Game'],
	["General Knowledge"]: ['General', 'General Knowledge'],
	["Geography"]: ['Geography'],
	["History"]: ['History'],
	["Mythology"]: ['Mythology', 'Myth'],
	["Politics"]: ['Politics'],
	["Science & Nature"]: ['Nature', 'Science', 'Science & Nature', 'Science and Nature'],
	["Science: Computers"]: ['Computers', 'Computer', 'Science: Computers', 'Science: Computer'],
	["Science: Gadgets"]: ['Gadgets', 'Gadget', 'Science: Gadgets', 'Science: Gadget'],
	["Science: Mathematics"]: ['Math', 'Mathematics', 'Science: Math', 'Science: Mathematics'],
	["Sports"]: ['Sports', 'Sport'],
	["Vehicles"]: ['Vehicles', 'Vehicle', 'Cars', 'Car'],
};
const CATEGORY_DATA = {
	options: CATEGORIES,
	keywords: CATEGORY_KEYWORDS,
};

const HIDDEN_LETTER_REGEX = /[a-zA-Z0-9 ]/;
const OPEN_LETTER_REGEX = /[^a-zA-Z0-9 ]/;


class Question {
	constructor(questionData, index, total) {
		this.category = he.unescape(questionData["category"]);
		this.type = he.unescape(questionData["type"]);
		this.difficulty = he.unescape(questionData["difficulty"]);
		this.text = he.unescape(questionData["question"]).trim();
		this.answer = he.unescape(questionData["correct_answer"]);
		
		this.index = index;
		this.total = total;
	}
	
	showQuestion(module) {
		module.say(`Question ${this.index + 1} / ${this.total}: ${this.text}`);
	}
	
	// noinspection JSUnusedLocalSymbols
	showAnswerHint(module) {
		Errors.abstract();
	}
	
	// noinspection JSUnusedLocalSymbols
	checkAnswer(answerText) {
		Errors.abstract();
	}
}

class Game {
	constructor(module) {
		this.module = module;
		this.currentQuestionIndex = -1;
		this.lastShownQuestionIndex = -1;
	}
	
	get type() {
		Errors.abstract();
	}
	
	get currentQuestion() {
		return this.currentQuestionIndex >= 0 && this.questions[this.currentQuestionIndex];
	}
	
	start(questionsData) {
		this.questions = [];
		for (let i = 0; i < questionsData.length; i++) {
			try {
				this.questions.push(this.makeQuestion(questionsData[i], i, questionsData.length));
			} catch {}
		}
		
		this.currentQuestionIndex = -1;
	}
	
	makeQuestion(questionData, index, total) {
		Errors.abstract();
		return null;
	}
	
	showQuestion() {
		this.currentQuestion.showQuestion(this.module);
		this.currentQuestion.showAnswerHint(this.module);
		this.lastShownQuestionIndex = this.currentQuestionIndex;
	}
	
	nextQuestion() {
		this.currentQuestionIndex++;
		if (this.currentQuestionIndex >= this.questions.length) {
			return false;
		} else {
			this.showQuestion();
			return true;
		}
	}
	
	checkAnswer(answerText) {
		return this.currentQuestion.checkAnswer(answerText);
	}
	
	endQuestion() {
		// Do nothing by default
	}
	
	end() {
		// Do nothing by default
	}
}

class MultipleChoiceGame extends Game {
	static Question = class MCQuestion extends Question {
		constructor(questionData, index, total) {
			super(questionData, index, total);
			this.incorrectAnswers = questionData["incorrect_answers"].map(ia => he.unescape(ia));
			
			let answersList = [this.answer].concat(this.incorrectAnswers);
			let answerCorrectness = answersList.map(() => false);
			answerCorrectness[0] = true;
			let answerIndices = _.shuffle(Object.keys(answersList).map(index => Number(index)));
			this.answers = {};
			for (let i = 0; i < answerIndices.length; i++) {
				let option = String.fromCharCode('a'.charCodeAt(0) + i);
				let optionIndex = answerIndices[i];
				this.answers[option] = {
					text: answersList[optionIndex],
					correct: answerCorrectness[optionIndex],
				};
			}
		}
		
		showAnswerHint(module) {
			let hints = Object.keys(this.answers).map(option => `${option.toUpperCase()}. ${this.answers[option].text}`);
			let fullHint = hints.join(' / ');
			module.say(fullHint);
		}
		
		checkAnswer(answerText) {
			let answer = this.answers[answerText.toLowerCase()];
			return answer && answer.correct;
		}
	}
	
	
	
	constructor(module) {
		super(module);
	}
	
	get type() {
		return "multipleChoice";
	}
	
	makeQuestion(questionData, index, total) {
		return new MultipleChoiceGame.Question(questionData, index, total);
	}
}

class LetterRevealGame extends Game {
	static Question = class LRQuestion extends Question {
		constructor(questionData, index, total) {
			super(questionData, index, total);
			
			this.questionLetters = null;
			this.hiddenLetters = null;
			this.totalLetterCount = 0;
			this.revealedLettersCount = 0;
			
			this.createHiddenText();
		}
		
		createHiddenText() {
			let questionText = this.answer;
			let questionWords = questionText.split(' ');
			let questionLetters = {};
			let hiddenLetters = {};
			let totalLetterCount = 0;
			for (let i = 0; i < questionWords.length; i++) {
				questionLetters[i] = {};
				hiddenLetters[i] = {};
				let wordLetters = {};
				for (let j = 0; j < questionWords[i].length; j++) {
					if (HIDDEN_LETTER_REGEX.test(questionWords[i][j])) {
						wordLetters[j] = questionWords[i][j];
						hiddenLetters[i][j] = '_';
						totalLetterCount++;
					} else {
						hiddenLetters[i][j] = questionWords[i][j];
					}
				}
				
				if (!_.isEmpty(wordLetters)) {
					questionLetters[i] = wordLetters;
				}
			}
			
			if (totalLetterCount === 0) {
				throw 'Bad question: no letters/numbers.';
			}
			
			this.questionLetters = questionLetters;
			this.hiddenLetters = hiddenLetters;
			this.totalLetterCount = totalLetterCount;
			
			let hiddenWords = questionWords.map(wordText => wordText.split('').join(' '));
			let wordSeparator = ' \u1427 ';
			return hiddenWords.join(wordSeparator);
			// let questionWords = questionText.split(' ');
			// let hiddenWords = questionWords.map(wordText => wordText.replace(/[a-zA-Z0-9]/g, '_').split('').join(' '));
			// let wordSeparator = ' \u1427 ';
			// return hiddenWords.join(wordSeparator);
		}
		
		revealLetter() {
			if (this.revealedLettersCount >= this.totalLetterCount - 1) {
				return false;
			}
			
			let wordIndex = Utils.randomKey(this.questionLetters);
			let letterIndex = Utils.randomKey(this.questionLetters[wordIndex]);
			this.hiddenLetters[wordIndex][letterIndex] = this.questionLetters[wordIndex][letterIndex];
			delete this.questionLetters[wordIndex][letterIndex];
			if (_.isEmpty(this.questionLetters[wordIndex])) {
				delete this.questionLetters[wordIndex];
			}
			
			this.revealedLettersCount++;
			
			return true;
		}
		
		wordLettersToArray(lettersMap) {
			let array = new Array(Object.keys(lettersMap).length);
			Object.keys(lettersMap).forEach(index => array[index] = lettersMap[index]);
			return array;
		}
		
		wordsMapToArrays(wordsMap) {
			let arrays = new Array(Object.keys(wordsMap).length);
			Object.keys(wordsMap).forEach(index => arrays[index] = this.wordLettersToArray(wordsMap[index]));
			return arrays;
		}
		
		wordsMapToText(wordsMap) {
			let lettersSeparator = ' ';
			let wordSeparator = ' \u1427 ';
			let wordArrays = this.wordsMapToArrays(wordsMap);
			let words = wordArrays.map(wordArray => wordArray.join(lettersSeparator));
			return words.join(wordSeparator);
		}
		
		showAnswerHint(module) {
			let hint = this.wordsMapToText(this.hiddenLetters);
			module.say(`Hint: ${hint}`);
		}
		
		toUniformAnswerFormat(answer) {
			return answer
				.toLowerCase()
				.replace(OPEN_LETTER_REGEX, '')
				.replace(/\s+/g, ' ')
				.trim();
		}
		
		checkAnswer(answerText) {
			return this.toUniformAnswerFormat(answerText) === this.toUniformAnswerFormat(this.answer);
		}
	}
	
	
	
	constructor(module) {
		super(module);
		this.revealTimer = Timers.repeating(() => this.revealLetter());
	}
	
	get type() {
		return "letters";
	}
	
	makeQuestion(questionData, index, total) {
		return new LetterRevealGame.Question(questionData, index, total);
	}
	
	nextQuestion() {
		this.revealTimer.clear();
		
		let hasNextQuestion = super.nextQuestion();
		if (hasNextQuestion) {
			this.revealTimer.set(this.module.config.gameSettings.revealInterval);
		}
		
		return hasNextQuestion;
	}
	
	revealLetter() {
		if (this.currentQuestion.revealedLettersCount < this.module.config.gameSettings.revealCount) {
			if (this.currentQuestion.revealLetter()) {
				this.currentQuestion.showAnswerHint(this.module);
			}
		}
	}
	
	endQuestion() {
		this.revealTimer.clear();
	}
	
	end() {
		this.endQuestion();
	}
}

const GAME_TYPES = {
	["letters"]:		LetterRevealGame,
	["multipleChoice"]:	MultipleChoiceGame,
};


class Trivia extends Module {
	constructor() {
		super({
			name: 'Trivia',
		});
		
		this.round = null;
		this.ongoing = false;
		this.questionActive = false;
		this.game = null;
		this.questionTimer = Timers.oneShot(() => this.questionFailed());
		this.delayTimer = Timers.oneShot(() => this.nextQuestion());
	}
	
	get bannedQuestions() {
		return this.data.questions[this.config.gameSettings.type].bans;
	}
	
	say(msg) {
		super.say(`/me [Trivia] ${msg}`);
	}
	
	defineModConfig(modConfig) {
		modConfig.addNaturalNumber('defaultAmount', 10)
			.setName('Default Amount')
			.setDescription('How many questions a round should have by default');
		modConfig.addCustomChoice('defaultDifficulty', {
				source: DIFFICULTIES_SOURCE_NAME,
			})
			.setName('Default Difficulty')
			.setDescription('How difficult the questions should be by default');
		modConfig.addCustomChoice('defaultCategory', {
				source: CATEGORIES_SOURCE_NAME,
			})
			.setName('Default Category')
			.setDescription('Which category the questions should be in by default');
		
		modConfig.addBoolean('allowAmountChoice', true)
			.setName('Allow Amount Selection')
			.setDescription('Specifies whether a number can be given to the command to choose how many questions the round will have');
		modConfig.addBoolean('allowDifficultyChoice', true)
			.setName('Allow Difficulty Selection')
			.setDescription('Specifies whether a difficulty can be specified for the round when starting one');
		modConfig.addBoolean('allowCategoryChoice', true)
			.setName('Allow Category Selection')
			.setDescription('Specifies whether a question category can be specified through the command');
		
		modConfig.addDuration('questionDuration', 60)
			.setName('Question Duration')
			.setDescription('Amount of time to wait for an answer before moving to the next question');
		
		modConfig.addDuration('questionDelay', 5)
			.setName('Question Delay')
			.setDescription('Amount of time to wait between questions');
		
		modConfig.addNaturalNumber('answerReward', 100)
			.setName('Answer Reward')
			.setDescription('Amount of points awarded for a correct answer');
		
		modConfig.addNaturalNumber('victoryReward', 1000)
			.setName('Victory Reward')
			.setDescription('Amount of points awarded for an overall win (most correct answers) - shared in case of a tie');
		
		modConfig.addNaturalNumber('maxQuestions', DEFAULT_MAX_QUESTIONS_PER_ROUND)
			.setName('Max Questions')
			.setDescription('Maximum amount of questions allowed per round');
		
		modConfig.add('gameSettings', 'TriviaGameType')
			.setName('Game Type')
			.setDescription('Specifies the way questions and answers are shown');
	}
	
	loadModConfig(conf) {
		if (!this.game || this.game.type !== conf.gameSettings.type) {
			this.end();
			this.game = new GAME_TYPES[conf.gameSettings.type](this);
		}
	}
	
	load() {
		ConfigSourceManager.setSourceOptions(
			DIFFICULTIES_SOURCE_NAME,
			Object.keys(DIFFICULTIES));
		ConfigSourceManager.setSourceOptions(
			CATEGORIES_SOURCE_NAME,
			Object.keys(CATEGORIES));
		
		this.onTwitchEvent('message', (user, message) => {
			if (this.questionActive) {
				this.processMessage(user, message);
			}
		});
	}
	
	persistentDataLoaded() {
		this.initializePersistentData();
	}
	
	initializePersistentData() {
		if (_.isEmpty(this.data)) {
			this.data.questions = {
				letters: {
					bans: [],
					questionFixes: {},
					answerFixes: {},
				},
				multipleChoice: {
					bans: [],
					questionFixes: {},
					answerFixes: {},
				},
			}
			
			this.data.userStats = {};
			
			this.saveData();
		}
	}
	
	findDataInString(data, string) {
		let selectedOptionKeys = [];
		let optionKeys = Object.keys(data.keywords);
		for (let i = 0; i < optionKeys.length; i++) {
			let optionKey = optionKeys[i];
			let keywords = data.keywords[optionKey];
			let found = false;
			for (let j = 0; j < keywords.length; j++) {
				let regex = new RegExp(`\\s${Utils.escapeRegExp(keywords[j])}\\s`, 'i');
				if (string.match(regex)) {
					found = true;
					break;
				}
			}
			
			if (found) {
				selectedOptionKeys.push(optionKey);
			}
		}
		
		return selectedOptionKeys;
	}
	
	parseParams(params) {
		let paramsString = ' ' + params.join(' ') + ' ';
		let roundSettings = {};
		
		// If allowed, find a number which specifies how many questions we should have
		if (this.config.allowAmountChoice) {
			let amountMatches = paramsString.match(/[\s,;:/\\]\d+[\s,;:/\\]/g);
			if (!amountMatches) {
				roundSettings.amount = this.config.defaultAmount;
			} else if (amountMatches.length > 1) {
				this.say('Please specify only one amount of questions.');
				return null;
			} else {
				roundSettings.amount = Number(amountMatches[0]);
			}
		} else {
			roundSettings.amount = this.config.defaultAmount;
		}
		
		// If allowed, find a difficulty setting
		if (this.config.allowDifficultyChoice) {
			let selectedDifficulties = this.findDataInString(DIFFICULTY_DATA, paramsString);
			if (selectedDifficulties.length > 1) {
				this.say('Please specify only one difficulty level.');
				return null;
			} else if (selectedDifficulties.length === 0) {
				roundSettings.difficulty = this.config.defaultDifficulty;
			} else {
				roundSettings.difficulty = selectedDifficulties[0];
			}
		} else {
			roundSettings.difficulty = this.config.defaultDifficulty;
		}
		
		// If allowed, find a category setting
		if (this.config.allowCategoryChoice) {
			let selectedCategories = this.findDataInString(CATEGORY_DATA, paramsString);
			if (selectedCategories.length > 1) {
				this.say('Please specify only one question category.');
				return null;
			} else if (selectedCategories.length === 0) {
				roundSettings.category = this.config.defaultCategory;
			} else {
				roundSettings.category = selectedCategories[0];
			}
		} else {
			roundSettings.category = this.config.defaultCategory;
		}
		
		return roundSettings;
	}
	
	makeURL(roundSettings) {
		// We ask for extra questions based on how many questions we've banned, so that if we get anything we've banned
		// we'll be able to filter them out and still have enough questions to fulfill the requested
		let banned = this.bannedQuestions;
		let requestAmount = Math.min(roundSettings.amount + banned.length, MAX_QUESTIONS_PER_REQUEST);
		let url = `https://opentdb.com/api.php?amount=${requestAmount}&type=multiple`;
		url += CATEGORIES[roundSettings.category];
		url += DIFFICULTIES[roundSettings.difficulty];
		return url;
	}
	
	fetchQuestions(roundSettings) {
		let url = this.makeURL(roundSettings);
		return axios.get(url, {timeout: REQUEST_TIMEOUT})
			.then(response => {
				let err = null;
				let data = response.data;
				if (!data || Number.isNaN(data["response_code"])) {
					err = 'No response code obtained from Trivia website.';
				} else if (data["response_code"] !== 0) {
					err = `Bad response from Trivia website: ${data["response_code"]}`;
				} else if (!data["results"] || data["results"].length === 0) {
					err = 'Trivia database returned an empty set.';
				}
				
				if (err) {
					this.error(err);
					return null;
				} else {
					let banned = this.bannedQuestions;
					return data.results.filter(qd => !banned.includes(qd["question"]));
				}
			})
			.catch(err => {
				this.error(err);
				return null;
			});
	}
	
	start(data) {
		this.startGame(data).then();
	}
	
	async startGame(data) {
		if (this.ongoing) {
			this.tell(data.user, 'A round of trivia is already underway!');
			return;
		}
		
		this.ongoing = true;
		let roundSettings = this.parseParams(data.params);
		if (!roundSettings) {
			this.ongoing = false;
			return;
		}
		
		let allQuestions = [];
		let questionTexts = [];
		for (let i = 0; i < MAX_FETCH_ATTEMPTS; i++) {
			let questions = await this.fetchQuestions(roundSettings);
			if (!questions) {
				continue;
			}
			
			questions = questions.filter(qd => !questionTexts.includes(qd.question));
			allQuestions.push(...questions);
			if (allQuestions.length >= roundSettings.amount) {
				break;
			}
			
			questionTexts.push(...questions.map(qd => qd.question));
		}
		
		if (allQuestions.length === 0) {
			this.ongoing = false;
			this.say('Sorry folks, there was a problem starting the trivia game.');
			return;
		}
		
		this.startRound(roundSettings, allQuestions.slice(0, roundSettings.amount));
		//
		// let url = this.makeURL(roundSettings);
		// axios.get(url, {timeout: REQUEST_TIMEOUT})
		// 	.then(response => {
		// 		let err = null;
		// 		let data = response.data;
		// 		if (!data || Number.isNaN(data["response_code"])) {
		// 			err = 'No response code obtained from Trivia website.';
		// 		} else if (data["response_code"] !== 0) {
		// 			err = `Bad response from Trivia website: ${data["response_code"]}`;
		// 		} else if (!data["results"] || data["results"].length === 0) {
		// 			err = 'Trivia database returned an empty set.';
		// 		}
		//
		// 		if (err) {
		// 			this.error(err);
		// 			this.ongoing = false;
		// 			this.say('Sorry folks, there was a problem starting the trivia game.');
		// 		} else {
		// 			let banned = this.bannedQuestions;
		// 			let questions = data.results.filter(qd => !(qd.question in banned)).slice(0, roundSettings.amount);
		// 			this.startRound(roundSettings, data.results);
		// 		}
		// 	})
		// 	.catch(err => {
		// 		this.error(err);
		// 		this.ongoing = false;
		// 	});
	}
	
	startRound(roundSettings, questions) {
		this.round = {
			settings: roundSettings,
			questions: questions,
			scores: {},
			maxScore: 0,
		};
		
		// Fix questions as per the corrections we have in our persistent data
		let fixes = this.data.questions[this.config.gameSettings.type];
		let fixedQuestions = _.cloneDeep(questions);
		for (let i = 0; i < questions.length; i++) {
			// NOTE: Replacement depends on the text of the UNCHANGED questions
			// (otherwise when we change things it can affect the decisions of
			// what we change)
			let originalQuestion = questions[i];
			let fixedQuestion = fixedQuestions[i];
			if (originalQuestion["question"] in fixes.questionFixes) {
				fixedQuestion["question"] = fixes.questionFixes[originalQuestion["question"]];
			}
			
			if (originalQuestion["question"] in fixes.answerFixes) {
				fixedQuestion["correct_answer"] = fixes.answerFixes[originalQuestion["question"]];
			}
		}
		
		// This is because our trivia database API seems to always return things in the same order
		// if the sample set contains all the questions in the selected category and difficulty
		fixedQuestions = _.shuffle(fixedQuestions);
		
		this.game.start(fixedQuestions);
		this.nextQuestion();
	}
	
	addCorrectAnswer(user) {
		if (!(user.name in this.round.scores)) {
			this.round.scores[user.name] = {
				user: user,
				score: 0,
			};
		}
		this.round.maxScore = Math.max(this.round.maxScore, ++this.round.scores[user.name].score);
		
		if (!(user.name in this.data.userStats)) {
			this.data.userStats[user.name] = {
				correctAnswers: 0,
				wins: 0,
			};
		}
		this.data.userStats[user.name].correctAnswers++;
		this.saveData();
	}
	
	addWin(user) {
		this.data.userStats[user.name].wins++;
		this.saveData();
	}
	
	questionSolved(user) {
		this.addCorrectAnswer(user);
		let reward = this.config.answerReward;
		this.say(`${user.displayName} is correct and wins ${this.pointsString(reward)}! The answer is: ${this.game.currentQuestion.answer}`);
		this.modifyUserPoints(user, reward).then().catch();
		this.endQuestion();
	}
	
	questionFailed() {
		this.say(`Nobody got it right! The answer was: ${this.game.currentQuestion.answer}`);
		this.endQuestion();
	}
	
	endQuestion() {
		this.questionActive = false;
		this.game.endQuestion();
		this.delayTimer.set(this.config.questionDelay);
	}
	
	nextQuestion() {
		if (this.game.nextQuestion()) {
			this.questionTimer.set(this.config.questionDuration);
			this.questionActive = true;
		} else {
			this.processResults();
			this.endRound();
		}
	}
	
	processMessage(user, message) {
		if (this.game.checkAnswer(message)) {
			this.questionSolved(user);
			this.endQuestion();
		}
	}
	
	processResults() {
		let message;
		let winners = Object.keys(this.round.scores)
			.filter(username => this.round.scores[username].score === this.round.maxScore)
			.map(username => this.round.scores[username].user);
		
		if (winners.length === 0) {
			message = "Nobody got a single thing! I'm disappointed in you...";
		} else {
			let score = this.round.scores[winners[0].name].score;
			let winsMessage = (score === 1) ? `one correct answer` : `${score} correct answers`;
			if (winners.length === 1) {
				this.modifyUserPoints(winners[0], this.config.victoryReward).then().catch();
				message = `Winner: ${winners[0].displayName} with ${winsMessage}! (+${this.pointsString(this.config.victoryReward)})`;
			} else {
				let victoryReward = Math.round(this.config.victoryReward / winners.length);
				winners.forEach(winner => this.modifyUserPoints(winner, victoryReward).then().catch());
				message = `Winners: ${Utils.makeEnglishAndList(winners.map(user => user.displayName))} with ${winsMessage} each! (+${this.pointsString(victoryReward)} each)`;
			}
		}
		
		winners.forEach(winner => this.addWin(winner));
		
		this.say(message);
	}
	
	endRound() {
		this.delayTimer.clear();
		this.questionTimer.clear();
		this.game.end();
		this.questionActive = false;
		this.ongoing = false;
		this.round = null;
	}
	
	end(data) {
		if (!this.ongoing) {
			if (data && data.user) {
				this.tell(data.user, "There isn't an ongoing round of trivia right now.");
			}
			
			return;
		}
		
		this.endRound();
		this.say('Trivia game cancelled.');
	}
	
	skip() {
		if (this.questionActive) {
			this.say('Question skipped.');
			this.endQuestion();
		}
	}
	
	banQuestion() {
		if (this.ongoing) {
			let questionIndex = this.game.lastShownQuestionIndex;
			if (questionIndex >= 0) {
				let questionText = this.round.questions[questionIndex]["question"];
				let bans = this.data.questions[this.config.gameSettings.type].bans;
				if (!bans.includes(questionText)) {
					bans.push(questionText);
					this.saveData();
					this.say(`Question banned. It will not show up again. The answer was: ${this.game.currentQuestion.answer}`);
				}
			}
			
			if (this.questionActive && this.game.currentQuestionIndex === questionIndex) {
				this.endQuestion();
			}
		}
	}
	
	fix(data, persistentDataFieldName) {
		if (!/\d+/.test(data.firstParam)) {
			this.tell(data.user, 'Please enter the question number first and then the correction.');
			return false;
		}
		
		let questionIndex = Number(data.firstParam) - 1;
		if (questionIndex < 0 || questionIndex >= this.round.questions.length) {
			this.tell(data.user, `Invalid question number. Please enter a value between 1 and ${this.round.questions.length}.`);
			return false;
		}
		
		let text = this.round.questions[questionIndex]["question"];
		this.data.questions[this.config.gameSettings.type][persistentDataFieldName][text] = data.params.slice(1).join(' ');
		this.saveData();
		return true;
	}
	
	fixQuestion(data) {
		if (this.fix(data, 'questionFixes')) {
			this.say('Question fixed. It will appear in its fixed form from now on.');
		}
	}
	
	fixAnswer(data) {
		if (this.fix(data, 'answerFixes')) {
			this.say('Answer fixed. It will appear in its fixed form from now on.');
		}
	}
	
	showWins(data) {
		if (data.user.name in this.data.userStats) {
			let stats = this.data.userStats[data.user.name];
			this.tell(data.user, `You've gotten ${stats.correctAnswers} answers right and have won ${stats.wins} games so far. Keep it up!`);
		} else {
			this.tell(data.user, "You haven't gotten any answers right yet. You can do it! I believe in you.");
		}
	}
	
	showCategories() {
		let cats = Object.keys(CATEGORY_KEYWORDS).map(cat => CATEGORY_KEYWORDS[cat][0]);
		let catString = `Available categories: ${cats.join(', ')}`;
		this.say(catString);
	}
	
	functions = {
		start: {
			name: 'Start Round',
			description: 'Starts a round of trivia in the chat',
			action: data => this.start(data),
			triggers: [
				this.trigger.command({
					cmdname: 'trivia',
				}),
			],
		},
		
		end: {
			name: 'End Round',
			description: 'Ends an active round of trivia',
			action: data => this.end(data),
			triggers: [
				this.trigger.command({
					cmdname: 'endtrivia',
				}),
			],
		},
		
		skip: {
			name: 'Skip Question',
			description: 'Skips the current question in the round',
			action: () => this.skip(),
			triggers: [
				this.trigger.command({
					cmdname: 'skipquestion',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
		},
		
		ban: {
			name: 'Ban Question',
			description: 'Bans the current question from ever appearing again for the current game type (also skips it)',
			action: data => this.banQuestion(data),
			triggers: [
				this.trigger.command({
					cmdname: 'banquestion',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
		},
		
		fixQuestion: {
			name: 'Fix Question',
			description: 'Fixes the specified question (specify its number) to say the given text next time it appears',
			action: data => this.fixQuestion(data),
			triggers: [
				this.trigger.command({
					cmdname: 'fixquestion',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
		},
		
		fixAnswer: {
			name: 'Fix Answer',
			description: 'Fixes the specified answer (specify its number) to the given text',
			action: data => this.fixAnswer(data),
			triggers: [
				this.trigger.command({
					cmdname: 'fixanswer',
				}),
			],
			filters: [
				this.filter.isMod(),
			],
		},
		
		showWins: {
			name: 'Show Wins',
			description: "Shows the user's correct answers and win statistics",
			action: data => this.showWins(data),
			triggers: [
				this.trigger.command({
					cmdname: 'triviawins',
				}),
			],
		},
		
		showCategories: {
			name: 'Show Categories',
			description: "Shows the available categories to choose from",
			action: () => this.showCategories(),
			triggers: [
				this.trigger.command({
					cmdname: 'triviacats',
					aliases: ['triviacategories'],
				}),
			],
		},
	}
}

module.exports = new Trivia();
