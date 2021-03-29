const Configuration = requireMain('./configuration');
const EntityFactory = require('./entityFactory');

class ModuleConfig extends Configuration {
	constructor(modName, modDescription, enabledByDefault) {
		super(`mod.${modName}`);
		if (modDescription) {
			this.addExpandableTextDisplay('moduleDescription', modDescription)
				.setName('Module Description');
		}
		
		this.addBoolean('enabled', enabledByDefault)
			.setDescription('Enables/disables this module (disabled modules will have no effect on anything)');
	}
	
	addFunction(key, data) {
		if (!this.configRoot.hasChild('functions')) {
			this.configRoot.addFixedArray('functions', 'Function')
				.setName('Functions')
				.setDescription('All the things this module can do');
		}
		
		this.getChild('functions').addElement(
			EntityFactory.build('Function', data));
	}
	
	// Uses addFunction() to add all of the commands in the given object
	addFunctions(functionsMap) {
		Object.keys(functionsMap).forEach(
			key => this.addFunction(key, functionsMap[key]));
	}
}

module.exports = ModuleConfig;
