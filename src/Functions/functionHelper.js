const Builders = require('./builders');
const GlobalVariables = require('./globalVariables');

class FunctionHelper {
	constructor() {
		this.helpData = {};
	}
	
	_processVars(variables) {
		if (variables) {
			return variables.map(variable => variable.toMarkdown());
		} else {
			return undefined;
		}
	}
	
	_collectGlobalData() {
		this.helpData.globals = this._processVars(GlobalVariables);
	}
	
	_collectInputData() {
		this.helpData.triggers = {};
		Object.keys(Builders.Triggers).forEach(triggerID => {
			this.helpData.triggers[triggerID] =
				this._processVars(
					Builders.Triggers[triggerID]().variables);
		});
	}
	
	_collectModuleData(modules) {
		let allModsData = {};
		Object.keys(modules).forEach(modName => {
			let modData = {};
			let module = modules[modName];
			
			if (module.variables) {
				modData.variables = this._processVars(module.variables);
			}
			
			if (module.functions) {
				modData.functions = {};
				Object.keys(module.functions).forEach(funcID => {
					let func = module.functions[funcID];
					if (func.variables) {
						modData.functions[funcID] =
							this._processVars(func.variables);
					}
				});
			}
			
			allModsData[modName] = modData;
		});
		
		this.helpData.modules = allModsData;
	}
	
	collectHelpData(modules) {
		this._collectGlobalData();
		this._collectInputData();
		this._collectModuleData(modules);
	}
	
	getHelpData() {
		return this.helpData;
	}
}

module.exports = new FunctionHelper();
