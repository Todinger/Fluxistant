const Variable = require('./functionVariable');
const Utils = requireMain('./utils');

function processData(name, variableData) {
	let newData = Utils.clone(variableData);
	
	if (!newData.name) {
		newData.name = name;
	}
	
	if (!newData.expr) {
		newData.expr = '$' + name;
	}
	
	if (!newData.replacement) {
		newData.replacement = data => {
			let outVars = data.context.params.out || {};
			return outVars[name];
		};
	}
	
	return newData;
}

class OutputVariable extends Variable {
	constructor(name, variableData) {
		super(processData(name, variableData));
	}
}

module.exports = OutputVariable;
