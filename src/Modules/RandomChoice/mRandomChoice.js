const assert = require('assert').strict;
const Module = requireMain('module');
const Utils = requireMain('utils');

class RandomChoice extends Module {
	constructor() {
		super({
			name: 'Random Choice',
		});
		
		this.textEntries = {};
		this.numberEntries = {};
		this.chooseFunctionObjects = {};
	}
	
	defineModConfig(modConfig) {
		modConfig.addDynamicArray('textEntries', 'TextChoice')
			.setName('Random Text')
			.setDescription('Choose a random option from a defined set');
		modConfig.addDynamicArray('numberEntries', 'NumberChoice')
			.setName('Random Number')
			.setDescription('Choose a random number from a range');
	}
	
	loadEntries(conf) {
		assert(conf.textEntries, `Random Choice missing its entries array (this is a bug).`);
		let textEntries = {};
		conf.textEntries.forEach(entry => {
			let cmdname = entry.cmdname;
			assert(!(cmdname in textEntries), `Random Choice has duplicate command "${cmdname}".`);
			textEntries[cmdname] = entry;
		});
		this.textEntries = textEntries;
		
		let numberEntries = {};
		conf.numberEntries.forEach(entry => {
			let cmdname = entry.cmdname;
			assert(!(cmdname in numberEntries || cmdname in textEntries), `Random Choice has duplicate command "${cmdname}".`);
			assert(entry.minimum <= entry.maximum, `Random Choice "${entry.cmdname}": Minimum must be <= Maximum.`);
			numberEntries[cmdname] = entry;
		});
		this.numberEntries = numberEntries;
	}
	
	addFunction(cmdname, action) {
		let funcID = `<Random Choice> ${cmdname}`;
		let funcDesc = {
			funcID: funcID,
			name: cmdname,
			action: action,
			triggers: [
				this.trigger.command({
					cmdname: cmdname,
				}),
			],
		};
		
		this.chooseFunctionObjects[funcID] = this.createFunctionObject(funcDesc);
	}
	
	loadModConfig(conf) {
		if (!conf.enabled) {
			// Disabling functions here to handle module being disabled (in this case
			// we don't want to load the entries since they might be invalid, and
			// we don't want to perform validity checks on disabled modules)
			this.deactivateFunctions(this.chooseFunctionObjects);
			return;
		}
		
		this.loadEntries(conf);
		
		// Disabling functions here to handle module still active and configuration changed
		this.deactivateFunctions(this.chooseFunctionObjects);
		
		this.chooseFunctionObjects = {};
		
		Object.keys(this.textEntries).forEach(cmdname => {
			this.addFunction(cmdname, data => this.chooseString(this.textEntries[cmdname], data));
		});
		
		Object.keys(this.numberEntries).forEach(cmdname => {
			this.addFunction(cmdname, data => this.chooseNumber(this.numberEntries[cmdname], data));
		});
		
		this.activateFunctions(this.chooseFunctionObjects);
	}
	
	chooseString(entry, data) {
		if (entry && entry.choices && entry.choices.length > 0) {
			let choice = Utils.randomElement(entry.choices);
			this.tell(data.user, choice);
		}
	}
	
	chooseNumber(entry, data) {
		let choice = Utils.randomInt(entry.minimum, entry.maximum);
		this.tell(data.user, choice);
	}
}

module.exports = new RandomChoice();
