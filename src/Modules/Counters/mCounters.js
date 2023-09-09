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
		this.globalCounterFunctions = this.loadCountersFromConfig(
			conf.globalCounters,
			this.globalCounterFunctions,
			'Global',
			(name) => this.incrementGlobal(name),
		);

		this.userCounterFunctions = this.loadCountersFromConfig(
			conf.userCounters,
			this.userCounterFunctions,
			'User',
			(name, data) => this.incrementUser(name, data),
		);
	}
	
	loadCountersFromConfig(counters, objectCollection, idPrefix, increment_function) {
		this.deactivateFunctions(objectCollection || {});
		objectCollection = {};

		if (counters) {
			for (let i = 0; i < counters.length; i++) {
				let func = counters[i].incrementFunction;
				func.action = (data) => increment_function(counters[i].name, data);

				let funcObject = this.createFunctionObject(func);
				if (!funcObject.funcID) {
					funcObject.funcID = `${idPrefix}CounterIncrementFunc[${i}]`;
				}

				objectCollection[funcObject.funcID] = funcObject;
			}
		}

		this.activateFunctions(objectCollection);
		return objectCollection;
	}

	incrementCounter(counterCollection, counterName) {
		if (!(counterName in counterCollection)) {
			counterCollection[counterName] = 0;
		}

		let newValue = ++counterCollection[counterName];
		this.saveData();
		return newValue;
	}

	incrementResultForCounter(newValue) {
		return {
			success:   true,
			variables: {
				value: newValue,
			},
		};
	}

	incrementGlobal(counterName) {
		let newValue = this.incrementCounter(this.data.global, counterName);

		return this.incrementResultForCounter(newValue);
	}

	incrementUser(counterName, data) {
		if (!(counterName in this.data.user)) {
			this.data.user[counterName] = {};
		}

		let newValue = this.incrementCounter(this.data.user[counterName], data.user.name);

		return this.incrementResultForCounter(newValue);
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
