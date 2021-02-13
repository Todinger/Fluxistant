const Configuration = requireMain('./configuration');

class ModuleConfig extends Configuration {
	constructor() {
		super();
		this.addBoolean('enabled', true);
	}
}

module.exports = ModuleConfig;
