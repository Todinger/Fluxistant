const Module = requireMain('module');
const child_process = require('child_process');

class Counters extends Module {
	constructor() {
		super({
			name: 'Counters',
		});

		this.globalCounterFunctions = {};
		this.userCounterFunctions = {};
		
		this.data = {
			global: {},
			user: {},
		};
	}

	defineModConfig(modConfig) {
		modConfig.addDynamicArray('globalCounters', 'Counter')
			.setName('Global Counters')
			.setDescription('Counters whose values are independent of users');
		modConfig.addDynamicArray('userCounters', 'Counter')
			.setName('User Counters')
			.setDescription('Counters whose values are specific to each user');
	}

	loadModConfig(conf) {
		this.loadCountersFromConfig(
			conf.globalCounters,
			this.globalCounterFunctions,
			'Global',
			(name) => this.incrementGlobal(name),
			(name) => this.showGlobal(name),
			(name) => this.reportGlobal(name),
		);

		this.loadCountersFromConfig(
			conf.userCounters,
			this.userCounterFunctions,
			'User',
			(name, data) => this.incrementUser(name, data),
			(name, data) => this.showUser(name, data),
			(name, data) => this.reportUser(name, data),
		);

		this.extraFuncObjects = {
			...this.globalCounterFunctions.incrementFunctionObjects,
			...this.globalCounterFunctions.showFunctionObjects,
			...this.globalCounterFunctions.reportFunctionObjects,
			...this.userCounterFunctions.incrementFunctionObjects,
			...this.userCounterFunctions.showFunctionObjects,
			...this.userCounterFunctions.reportFunctionObjects,
		};
	}

	makeCounterFunction(counterName, func, actionFunction, funcID) {
		func.action = (data) => actionFunction(counterName, data);

		let funcObject = this.createFunctionObject(func);
		if (!funcObject.funcID) {
			funcObject.funcID = funcID;
		}

		return funcObject;
	}
	
	loadCountersFromConfig(counters, objectCollection, idPrefix, incrementAction, showAction, reportAction) {
		if (objectCollection) {
			this.deactivateFunctions(objectCollection.incrementFunctionObjects || {});
			this.deactivateFunctions(objectCollection.showFunctionObjects || {});
			this.deactivateFunctions(objectCollection.reportFunctionObjects || {});
		}

		objectCollection.incrementFunctionObjects = {};
		objectCollection.showFunctionObjects = {};
		objectCollection.reportFunctionObjects = {};

		if (counters) {
			for (let i = 0; i < counters.length; i++) {
				let incrementFuncObject = this.makeCounterFunction(
					counters[i].name,
					counters[i].incrementFunction,
					incrementAction,
					`${idPrefix}CounterIncrementFunc[${i}]`,
				);
				objectCollection.incrementFunctionObjects[incrementFuncObject.funcID] = incrementFuncObject;

				let showFuncObject = this.makeCounterFunction(
					counters[i].name,
					counters[i].showFunction,
					showAction,
					`${idPrefix}CounterShowFunc[${i}]`,
				);
				objectCollection.showFunctionObjects[showFuncObject.funcID] = showFuncObject;

				let reportFuncObject = this.makeCounterFunction(
					counters[i].name,
					counters[i].reportFunction,
					reportAction,
					`${idPrefix}CounterReportFunc[${i}]`,
				);
				objectCollection.reportFunctionObjects[reportFuncObject.funcID] = reportFuncObject;
			}
		}

		this.activateFunctions(objectCollection.incrementFunctionObjects);
		this.activateFunctions(objectCollection.showFunctionObjects);
		this.activateFunctions(objectCollection.reportFunctionObjects);
	}

	incrementCounter(counterCollection, counterName) {
		if (!(counterName in counterCollection)) {
			counterCollection[counterName] = 0;
		}

		let newValue = ++counterCollection[counterName];
		this.saveData();
		return newValue;
	}

	getCounter(counterCollection, counterName) {
		if (counterName in counterCollection) {
			return counterCollection[counterName];
		} else {
			return 0;
		}
	}

	getUserCounter(counterName, username) {
		if (counterName in this.data.user) {
			return this.getCounter(this.data.user[counterName], username);
		}

		return 0;
	}

	actionResultForCounter(newValue) {
		return {
			success:   true,
			variables: {
				value: newValue,
			},
		};
	}

	incrementGlobal(counterName) {
		const newValue = this.incrementCounter(this.data.global, counterName);

		return this.actionResultForCounter(newValue);
	}

	incrementUser(counterName, data) {
		if (!(counterName in this.data.user)) {
			this.data.user[counterName] = {};
		}

		const newValue = this.incrementCounter(this.data.user[counterName], data.user.name);

		return this.actionResultForCounter(newValue);
	}

	showGlobal(counterName) {
		const value = this.getCounter(this.data.global, counterName);

		return this.actionResultForCounter(value);
	}

	showUser(counterName, data) {
		const value = this.getUserCounter(counterName, data.user.name);
		return this.actionResultForCounter(value);
	}

	reportGlobal(counterName) {
		const value = this.getCounter(this.data.global, counterName);
		this.print(`Counter <${counterName}> value: ${value}`);

		return this.actionResultForCounter(value);
	}

	_reportUserSingle(counterName, username) {
		const value = this.getUserCounter(counterName, username);
		this.print(`Counter <${counterName}> value for user ${username}: ${value}`)
	}

	_reportUserMulti(counterName, forExport = false) {
		this.print(`Counter <${counterName}> values for all saved users:`);
		const counter = this.data.user[counterName];
		let users = Object.keys(counter);
		if (forExport) {
			users.sort((user1, user2) => user1.localeCompare(user2));
			let exportedText = "";
			users.forEach((username) => {
				exportedText += `${username}\t${counter[username]}\n`;
			});
			child_process.spawn('clip').stdin.end(exportedText);
			this.print(`Exported data copied to clipboard:\n${exportedText}`);
		} else {
			users.sort((user1, user2) => counter[user2] - counter[user1]);
			users.forEach((username) => {
				this.print(`  ${username}: ${counter[username]}`);
			});
		}
	}

	reportUser(counterName, data) {
		if (data.firstParam) {
			if (data.firstParam === "export" || data.firstParam === "report") {
				this._reportUserMulti(counterName, true);
			} else {
				this._reportUserSingle(counterName, data.firstParam);
			}
		} else {
			this._reportUserMulti(counterName);
		}
	}

	variables = [
		this.variable.out('value', {
			name: 'Value (`$value`)',
			description: 'The updated value of the counter',
			example: 'Yecats got lost again! She has now lost her way $value times!',
			expr: 'value',
		}),
	]
}

module.exports = new Counters();
