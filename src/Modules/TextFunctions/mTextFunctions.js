const Module = requireMain('module');

class TextFunctions extends Module {
	constructor() {
		super({
			name: 'Text Functions',
		});
		
		this.textFunctions = {};
	}
	
	defineModConfig(modConfig) {
		modConfig.add(
			'textFunctions',
			'DynamicArray',
			'TextFunction')
			.setName('Text Functions')
			.setDescription('Functions for writing text responses');
	}
	
	loadModConfig(conf) {
		this.deactivateFunctions(this.textFunctions || {});
		
		this.textFunctions = {};
		if (conf.textFunctions) {
			for (let i = 0; i < conf.textFunctions.length; i++) {
				let func = conf.textFunctions[i];
				let funcObject = this.createFunctionObject(func);
				
				funcObject.action = function() {};
				if (!funcObject.funcID) {
					funcObject.funcID = `TextFunc[${i}]`;
				}
				
				this.textFunctions[funcObject.funcID] = funcObject;
			}
		}
		
		this.activateFunctions(this.textFunctions);
		this.extraFuncObjects = this.textFunctions;
	}
}

module.exports = new TextFunctions();
