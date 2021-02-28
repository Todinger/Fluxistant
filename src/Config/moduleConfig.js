const Configuration = requireMain('./configuration');

class ModuleConfig extends Configuration {
	constructor(modName) {
		super(`mod.${modName}`);
		this.addBoolean('enabled', true);
	}
}

module.exports = ModuleConfig;
