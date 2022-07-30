'use strict';

const assert = require('assert').strict;
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
		
		this.resetGame();
		this.food = {
			groups: {}, // Mapping of group name to array of food names in the group
			items: {},  // Mapping of food name to FoodItemEntity conf
		}
		
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
		modConfig.addDynamicArray('foodGroups', 'FoodGroup')
			.setName('Food Groups')
			.setDescription('All the food types and items available');
		modConfig.addDynamicArray('feedingLevels', 'FeedingLevel')
			.setName('Feeding Levels')
			.setDescription('The various levels of chubbiness our munching champion has');
		modConfig.add('overfedImage', 'Image')
			.setName('Overfed Image')
			.setDescription('The image shown when overfed and the game ends');
	}
	
	validateModConfig(conf) {
		// Validate that each food group and food item is unique (also disallow the same name between
		// food groups and food items)
		let seenFoodNames = [];
		conf.foodGroups.forEach(foodGroup => {
			assert (!seenFoodNames.includes(foodGroup.groupName),
				`Duplicate food / food group name: ${foodGroup.groupName}`);
			seenFoodNames.push(foodGroup.groupName);
			Object.values(foodGroup.foodItems.files).forEach(foodItem => {
				assert (!seenFoodNames.includes(foodItem.foodName),
					`Duplicate food / food group name: ${foodItem.foodName}`);
				seenFoodNames.push(foodItem.foodName);
			});
		});
	}
	
	loadModConfig(conf) {
		if (!conf.enabled) {
			return;
		}
		
		this.validateModConfig(conf);
		
		// Changing configuration kills the game
		this.stop();
		
		// Index the foods and food groups by name
		this.food = {
			groups: {},
			items:  {},
		}
		conf.foodGroups.forEach(foodGroup => {
			let groupName = foodGroup.groupName.trim().toLowerCase();
			this.food.groups[groupName] = [];
			Object.values(foodGroup.foodItems.files).forEach(foodItem => {
				let foodName = foodItem.foodName.trim().toLowerCase();
				this.food.groups[groupName].push(foodName);
				this.food.items[foodName] = foodItem;
			});
		});
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
		this.running = false;
		this.busy = false; // Used when feeding has begun until it's done
		this.currentLevel = 0;
		this.currentFullness = 0;
	}
	
	async start(data) {
		if (this.running) {
			this.tellError(data.user, "A feeding game is already underway!");
			return false;
		}
		
		this.resetGame();
		this.running = true;
		
		this.sendCurrentLevel();
		await Utils.getPromiseFromEvent(this.events, 'levelImagesSet');
		
		this.broadcastEvent('show');
	}
	
	stop() {
		this.broadcastEvent('hide');
		this.resetGame();
	}
	
	selectFoodItem(data) {
		let name = Utils.isNonEmptyString(data.allParams) ? data.allParams.toLowerCase() : "";
		if (name in this.food.groups) {
			name = Utils.randomElement(this.food.groups[name]);
		}
		
		if (!(name in this.food.items)) {
			name = Utils.randomKey(this.food.items);
		}
		
		return this.food.items[name];
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
		this.currentLevel++;
		this.sendCurrentLevel();
		this.currentFullness = 0;
		
		if (this.currentLevel > this.maxLevel) {
			await this.modifyUserPoints(feeder, -this.config.lossPenalty);
			return false;
		} else {
			return true;
		}
	}
	
	async feed(data) {
		if (!this.running || this.busy || this.currentLevel > this.maxLevel) {
			return {
				success: null,
			};
		}
		
		let foodItem = this.selectFoodItem(data);
		
		// NOM NOM NOM
		this.busy = true;
		this.sendFoodImage(foodItem);
		await Utils.getPromiseFromEvent(this.events, 'feedDone');
		this.busy = false;
		
		// Feeding logic (points, food levels, etc.)
		
		let feedingLevel = this.config.feedingLevels[this.currentLevel];
		let addedNutrition = Utils.randomInt(foodItem.minValue, foodItem.maxValue);
		this.currentFullness += addedNutrition;
		if (this.currentFullness > feedingLevel.capacity) {
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
			food: foodItem.foodName,
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
