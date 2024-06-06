const Module = requireMain('module');

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
		);

		this.loadCountersFromConfig(
			conf.userCounters,
			this.userCounterFunctions,
			'User',
			(name, data) => this.incrementUser(name, data),
			(name, data) => this.showUser(name, data),
		);

		this.extraFuncObjects = {
			...this.globalCounterFunctions.incrementFunctionObjects,
			...this.globalCounterFunctions.showFunctionObjects,
			...this.userCounterFunctions.incrementFunctionObjects,
			...this.userCounterFunctions.showFunctionObjects,
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
	
	loadCountersFromConfig(counters, objectCollection, idPrefix, incrementAction, showAction) {
		if (objectCollection) {
			this.deactivateFunctions(objectCollection.incrementFunctionObjects || {});
			this.deactivateFunctions(objectCollection.showFunctionObjects || {});
		}

		objectCollection.incrementFunctionObjects = {};
		objectCollection.showFunctionObjects = {};

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
			}
		}

		this.activateFunctions(objectCollection.incrementFunctionObjects);
		this.activateFunctions(objectCollection.showFunctionObjects);
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

	actionResultForCounter(newValue) {
		return {
			success:   true,
			variables: {
				value: newValue,
			},
		};
	}

	incrementGlobal(counterName) {
		let newValue = this.incrementCounter(this.data.global, counterName);

		return this.actionResultForCounter(newValue);
	}

	incrementUser(counterName, data) {
		if (!(counterName in this.data.user)) {
			this.data.user[counterName] = {};
		}

		let newValue = this.incrementCounter(this.data.user[counterName], data.user.name);

		return this.actionResultForCounter(newValue);
	}

	showGlobal(counterName) {
		let value = this.getCounter(this.data.global, counterName);

		return this.actionResultForCounter(value);
	}

	showUser(counterName, data) {
		let value = 0;
		if (counterName in this.data.user) {
			value = this.getCounter(this.data.user[counterName], data.user.name);
		}
		
		return this.actionResultForCounter(value);
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
