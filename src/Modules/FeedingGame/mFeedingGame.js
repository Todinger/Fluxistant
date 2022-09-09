'use strict';

const Module = requireMain('module');
const EventNotifier = requireMain('eventNotifier');
const Utils = requireMain('utils');

const DEFAULT_REWARD = 100;

class FeedingGame extends Module {
	constructor() {
		super({
			name: 'Feeding Game',
			webname: 'feedingGame',
			source: 'feedingGame.html',
		});
		
		this.data.state = {};
		
		this.food = {
			tags: {},
			all: [],
		};
		
		
		this.events = new EventNotifier();
		this.events._addEvent('feedDone');
		this.events._addEvent('levelImagesSet');
	}
	
	defineModAssets(modData) {
		modData.addUniformPool('Images');
	}
	
	defineModConfig(modConfig) {
		modConfig.addNaturalNumber('lossPenalty', 10000)
			.setName('Loss Penalty')
			.setDescription('Amount of points the viewer who goes over the limit loses');
		modConfig.addString('generalFoodTags')
			.setName('General Food Tags', 'food, anything, stuff, thing, something, whatever')
			.setDescription('Using any of these comma-separated tags will select a random food item.');
		modConfig.add(
				'foodItems',
				'MultiAsset',
				{
					collection: 'Images',
					dataType: 'IMAGE',
					elementValueType: 'FoodItem',
				})
			.setName('Food Items')
			.setDescription('All available foodstuffs in the game');
		modConfig.addDynamicArray('feedingLevels', 'FeedingLevel')
			.setName('Feeding Levels')
			.setDescription('The various levels of chubbiness our munching champion has');
		modConfig.add('overfedImage', 'Image')
			.setName('Overfed Image')
			.setDescription('The image shown when overfed and the game ends');
	}
	
	toTagsList(tagsString) {
		if (!tagsString) {
			return [];
		}
		
		let tags = tagsString
			.split(',')
			.map(tag => tag.trim().replace(/\s+/g, ' ')) // Remove duplicate spaces
			.filter(tag => Utils.isNonEmptyString(tag)); // Remove empty tags
		tags = [...new Set(tags)]; // Remove duplicates
		return tags;
	}
	
	loadModConfig(conf) {
		if (!conf.enabled) {
			return;
		}
		
		// Index the foods and food groups by name
		this.food = {
			tags: {},
			all: [],
		};
		Object.values(conf.foodItems.files).forEach(foodItem => {
			let tagsString = foodItem.tags.toLowerCase();
			let tags = this.toTagsList(tagsString);
			
			// Update the foodItem's tags with the changes
			foodItem.tags = tags;
			
			if (tags.length > 0) {
				tags.forEach(tag => {
					if (!(tag in this.food.tags)) {
						this.food.tags[tag] = [foodItem];
					} else {
						this.food.tags[tag].push(foodItem);
					}
					
					this.food.all.push(foodItem);
				});
			}
		});
		
		// Parse the general food item tags
		this.generalFoodTags = this.toTagsList(conf.generalFoodTags);
	}
	
	load() {
		this.onClientAttached(socket => {
			socket.on('feedDone', () => {
				if (this.running) {
					this.events._notify('feedDone');
				}
			});
			socket.on('levelImagesSet', () => {
				if (this.running) {
					this.events._notify('levelImagesSet');
				}
			});
			socket.on('syncState', () => {
				if (this.running) {
					this.setLevelImages(this.getCurrentLevelImages(), 'sync');
				}
			})
			
			if (this.running) {
				this.setLevelImages(this.getCurrentLevelImages(), 'sync');
			}
		});
	}
	
	persistentDataLoaded() {
		if (this.running) {
			this.sendCurrentLevel();
			this.broadcastEvent('show');
		}
	}
	
	get running() {
		return this.data && this.data.state && this.data.state.running;
	}
	
	get currentLevel() {
		return this.data.state.currentLevel;
	}
	
	get maxLevel() {
		return this.config.feedingLevels.length - 1;
	}
	
	sendFoodImage(foodItem) {
		this.assets.Images.getFileWebByKey(foodItem.fileKey)
		.then(file => {
			let displayData = foodItem.makeDisplayData(file);
			this.broadcastEvent('feed', displayData);
		});
	}
	
	setLevelImages(images, eventName = 'setLevelImages') {
		let entries = Object.entries(images);
		let promises = entries.map(([_, image]) => this.assets.Images.getFileWebByKey(image.file.fileKey));
		
		Promise.all(promises)
		.then(files => {
			let parameters = {};
			for (let i = 0; i < entries.length; i++) {
				parameters[entries[i][0]] = entries[i][1].makeDisplayData(files[i]);
			}
			
			this.broadcastEvent(eventName, parameters);
		});
	}
	
	resetGame() {
		this.data.state = {};
		this.saveData();
		// this.running = false;
		// this.busy = false; // Used when feeding has begun until it's done
		// this.currentLevel = 0;
		// this.currentFullness = 0;
	}
	
	async start(data) {
		if (this.running) {
			this.tellError(data.user, "A feeding game is already underway!");
			return false;
		}
		
		this.data.state = {
			running: true,
			currentLevel: 0,
			currentFullness: 0,
		};
		
		this.saveData();
		
		this.sendCurrentLevel();
		// await Utils.getPromiseFromEvent(this.events, 'levelImagesSet');
		
		this.broadcastEvent('show');
	}
	
	stop() {
		this.broadcastEvent('hide');
		this.resetGame();
	}
	
	selectFoodItem(data) {
		let tag = Utils.isNonEmptyString(data.allParams) ? data.allParams.toLowerCase() : "";
		if (tag !== "") {
			if (tag in this.food.tags) {
				return Utils.randomElement(this.food.tags[tag]);
			} else if (this.generalFoodTags.includes(tag)) {
				return Utils.randomElement(this.food.all);
			} else {
				return null;
			}
		} else {
			return Utils.randomElement(this.food.all);
		}
	}
	
	getCurrentLevelImages() {
		if (this.currentLevel > this.maxLevel) {
			return {
				backClosed: this.config.overfedImage,
			};
		} else {
			let feedingLevel = this.config.feedingLevels[this.currentLevel];
			
			// Omit missing images, as they become blank on the web page
			let images = {}
			for (let name of ['backClosed', 'backOpen', 'frontClosed', 'frontOpen']) {
				if (feedingLevel[name + 'Image'].file.fileKey) {
					images[name] = feedingLevel[name + 'Image'];
				}
			}
			
			return images;
		}
	}
	
	sendCurrentLevel() {
		this.setLevelImages(this.getCurrentLevelImages());
	}
	
	async nextLevel(feeder) {
		this.data.state.currentLevel++;
		this.sendCurrentLevel();
		this.data.state.currentFullness = 0;
		this.saveData();
		
		if (this.currentLevel > this.maxLevel) {
			await this.modifyUserPoints(feeder, -this.config.lossPenalty);
			return false;
		} else {
			return true;
		}
	}
	
	async feed(data) {
		if (!this.running || this.currentLevel > this.maxLevel) {
			return {
				success: null,
			};
		}
		
		let foodItem = this.selectFoodItem(data);
		if (!foodItem) {
			this.tellError(data.user, "Silly, kitty doesn't like that!");
			return {
				success: null,
			};
		}
		
		// NOM NOM NOM
		
		// !!! NOTE !!!
		// I'm removing the busy flag because if an answer never comes, the
		// game gets stuck forever. Ideally we'd have a timeout, but that
		// requires using Abort Controllers, which requires Node 15+, and
		// updating Node causes issues with the iohook library that I am not
		// liable to fix at the moment (I tried, it got complicated, I
		// stopped).
		// So be sure to add proper cooldowns yourself and not use the game
		// without its client showing.
		
		// this.busy = true;
		this.sendFoodImage(foodItem);
		await Utils.getPromiseFromEvent(this.events, 'feedDone');
		// this.busy = false;
		
		// Feeding logic (points, food levels, etc.)
		
		let feedingLevel = this.config.feedingLevels[this.currentLevel];
		let addedNutrition = Utils.randomInt(foodItem.minValue, foodItem.maxValue);
		this.data.state.currentFullness += addedNutrition;
		this.saveData();
		if (this.data.state.currentFullness > feedingLevel.capacity) {
			if (!await this.nextLevel(data.user)) {
				return {
					success: false,
					variables: {
						penalty: this.config.lossPenalty,
					},
				};
			}
		}
		
		let reward = foodItem.points * feedingLevel.multiplier;
		if (isNaN(reward)) {
			reward = DEFAULT_REWARD;
		}
		
		reward = Math.round(reward);
		await this.modifyUserPoints(data.user, reward);
		
		return {
			food: Utils.randomElement(foodItem.tags),
			reward,
		};
	}
	
	functions = {
		startGame: {
			name: 'Start Game',
			description: 'Start a new game',
			action: data => this.start(data),
		},
		feed: {
			name: 'Feed',
			description: 'Feed the cat!',
			cooldowns: {
				global: 5, // Default cooldown to let the feeding animation end
			},
			triggers: [
				this.trigger.command({
					cmdname: 'feed',
				}),
			],
			variables: [
				this.variable.out('food', {
					name: 'Food (`$food`)',
					description: 'The food that was selected',
					example: '"Kitty loves the $food you fed it and gives you $reward points for it!" ---> "Kitty loves the turkey you fet it and gives you 100 points for it!"',
					expr: '$food',
				}),
				this.variable.out('reward', {
					name: 'Reward (`$reward`)',
					description: 'The amount of points granted for a successful feeding',
					example: '"Kitty loves the $food you fed it and gives you $reward points for it!" ---> "Kitty loves the turkey you fet it and gives you 100 points for it!"',
					condition: 'Can only be used for successful feedings.',
					expr: '$reward',
				}),
				this.variable.out('penalty', {
					name: 'Penalty (`$penalty`)',
					description: 'The amount of points lost for overfeeding',
					example: '"KITTY EXPLOSION! The cleaner charges you $penalty points to clean the barf from your clothes." ---> "KITTY EXPLOSION! The cleaner charges you 10000 points to clean the barf from your clothes."',
					condition: 'Can only be used for feed attempts that caused overfeeding (and ended the game).',
					expr: 'penalty',
				}),
			],
			action: async data => this.feed(data),
		},
		stopGame: {
			name: 'Stop Game',
			description: "Stop the game if it's running",
			action: () => this.stop(),
		},
	}
}

module.exports = new FeedingGame();
