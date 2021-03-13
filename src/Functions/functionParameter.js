
class FunctionParameter {
	constructor(settings) {
		this.name = settings.name;
		this.description = settings.description || '';
		this.default = settings.default;
		this.takeAll = settings.takeAll === true;
	}
}

module.exports = FunctionParameter;
