const Module = requireMain('module');
const Utils = requireMain('utils');
const _ = require('lodash');

class ContinuousGiveaway extends Module {
	constructor() {
		super({
			name: 'Continuous Giveaway',
		});
		
		this.ongoing = false;
		this.data.entrees = {};
	}
	
	start(data) {
		if (this.ongoing) {
			// this.tellError(data.user, "A giveaway is already underway!");
			return;
		}
		
		this.data.entrees = {};
		this.ongoing = true;
		this.saveData();
		
		this.say("A giveaway is underway!");
	}
	
	resume(data) {
		if (this.ongoing) {
			// this.tellError(data.user, "A giveaway is already underway!");
			return;
		}
		
		this.ongoing = true;
	}
	
	end(data) {
		if (!this.ongoing) {
			return;
		}
		
		// this.say("The giveaway has ended.");
		this.ongoing = false;
	}
	
	join(data) {
		if (!this.ongoing) {
			return;
		}
		
		if (data.user.displayName in this.data.entrees) {
			return;
		}
		
		this.data.entrees[data.user.name] = false; // false = hasn't won yet
		this.saveData();
	}
	
	draw(data) {
		if (!this.ongoing && _.isEmpty(this.data.entrees)) {
			return;
		}
		
		let options = Object.keys(this.data.entrees).filter(entree => !this.data.entrees[entree]);
		if (options.length === 0) {
			this.warn("No viable entrees to draw from.");
			// this.tellError(data.user, "There are no entrees viable for winning at this time.")
			return;
		}
		
		let winner = Utils.randomElement(options);
		this.data.entrees[winner] = true;
		this.saveData();
		// this.sendSEMessage(`${winner} has won the giveaway!`);
		this.say(`${winner} has won the giveaway!`);
	}
	
	functions = {
		start: {
			name: 'Start Giveaway',
			description: 'Starts a continuous giveaway',
			triggers: [
				this.trigger.command({
					cmdname: 'startcga',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.start(data),
		},
		resume: {
			name: 'Resume Giveaway',
			description: 'Starts an ongoing continuous giveaway without clearing previous results',
			triggers: [
				this.trigger.command({
					cmdname: 'resumecga',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.resume(data),
		},
		end: {
			name: 'End Giveaway',
			description: 'Ends an ongoing continuous giveaway',
			triggers: [
				this.trigger.command({
					cmdname: 'endcga',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.end(data),
		},
		join: {
			name: 'Join Giveaway',
			description: 'Enters the user into an ongoing continuous giveaway',
			triggers: [
				this.trigger.command({
					cmdname: 'enter',
				}),
				this.trigger.command({
					cmdname: 'ticket',
				}),
			],
			action: data => this.join(data),
		},
		draw: {
			name: 'Draw Winner',
			description: "Draw a single winner who hasn't won yet from current entrees",
			triggers: [
				this.trigger.command({
					cmdname: 'draw',
				}),
			],
			filters: [
				this.filter.specificUser("fluxistence"),
			],
			action: data => this.draw(data),
		},
	}
}

module.exports = new ContinuousGiveaway();
