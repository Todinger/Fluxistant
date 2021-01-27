const Configuration = requireMain('./configuration');

class ModuleConfig extends Configuration {
	constructor() {
		super();
		this.addChild('enabled', 'Value', true);
	}
}

module.exports = ModuleConfig;
