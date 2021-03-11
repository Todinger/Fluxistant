const Configuration = requireMain('./configuration');

class ModuleConfig extends Configuration {
	constructor(modName, enabledByDefault) {
		super(`mod.${modName}`);
		this.addBoolean('enabled', enabledByDefault);
	}
}

module.exports = ModuleConfig;
