const Configuration = requireMain('./configuration');

class ModuleConfig extends Configuration {
	constructor() {
		super();
		this.addChild('enabled', 'Boolean', true);
	}
}

module.exports = ModuleConfig;
