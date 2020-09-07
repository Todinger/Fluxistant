class Effect {
	constructor(name, webname) {
		this.name = name;
		this.webname = webname;
	}
	
	load() {
		throw "Abstract effect loaded.";
	}
}

module.exports = {
	Effect: Effect,
};
