const Configuration = requireMain('./configuration');
// const ObjectEntity = requireConfig('objectEntity');
// const EntityFactory = require('./entityFactory');

class ModuleConfig extends Configuration {
	constructor() {
		super();
		this.addChild('enabled', 'Value', true);
	}
}

module.exports = ModuleConfig;
