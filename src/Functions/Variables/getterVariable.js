const Variable = require('./functionVariable');
const Utils = requireMain('./utils');

function emptyGetter() {
	return "";
}

function processData(name, variableData) {
	let newData = Utils.clone(variableData);
	
	if (!newData.name) {
		newData.name = name;
	}
	
	if (!newData.expr) {
		newData.expr = '$' + name;
	}
	
	if (!newData.getter) {
		newData.getter = emptyGetter;
	}
	
	if (!newData.replacement) {
		newData.replacement = newData.getter;
	}
	
	return newData;
}

class GetterVariable extends Variable {
	constructor(name, variableData) {
		super(processData(name, variableData));
	}
}

module.exports = GetterVariable;
