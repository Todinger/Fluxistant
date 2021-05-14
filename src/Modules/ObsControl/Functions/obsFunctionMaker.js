const ObsFunction = require('./obsFunction');
const ObsFunctionDetails_BaseEntity = require('../Config/obsFunctionDetails_BaseEntity');
const Utils = requireMain('utils');

const Validators = {
	string: { validate: (value) => Utils.isNonEmptyString(value) },
}

class ObsFunctionParameter {
	constructor(details) {
		this.config = details.config;
		this.webSocketID = details.webSocketID;
		this.defaultValue = details.defaultValue;
		if (details.validators) {
			this.validators = Array.isArray(details.validators) ?
				details.validators :
				[ details.validators ];
		} else {
			this.validators = [];
		}
	}
	
	validate(value) {
		return this.validators.reduce((soFar, validator) => soFar && validator(value), true);
	}
}


// function emptyFunc() {}
//
// function populateConfig_Params(entity, params) {
// 	if (!Array.isArray(params)) {
// 		params = [params];
// 	}
//
// 	params.forEach(param => {
// 		entity.add(param.config.key, param.config.entityType, param.config.constructorData)
// 			.setName(param.config.name)
// 			.setDescription(param.config.description);
// 	});
// }

// function setData_Params(entity, params, data) {
// 	if (data) {
// 		params.forEach(param => {
// 			this.getChild(param.config.key).setValue(data.value);
// 		});
// 	}
// }

function makeObsFunction(details) {
	details.parameters =
		details.parameters
			? Array.isArray(details.parameters)
				? details.parameters
				: [details.parameters]
			: [];
	
	let configEntityClass = class extends ObsFunctionDetails_BaseEntity {
		constructor() {
			super(details.config.displayText);
			this.setDescription(details.config.description);
			
			details.parameters.forEach(param => {
				this.add(param.config.key, param.config.entityType, param.config.constructorData)
					.setName(param.config.name)
					.setDescription(param.config.description);
			});
			
			// this.setData(data);
		}
	}
	
	let funcClass = class extends ObsFunction {
		constructor(obsSocket, data) {
			super(obsSocket, data);
			
			this.paramValues = {};
			details.parameters.forEach(param => {
				param.validate(data[param.config.key]);
				this.paramValues[param.config.key] = param.config.key in data
					? data[param.config.key]
					: param.defaultValue;
			});
		}
		
		invoke() {
			if (details.invokeFunc) {
				return details.invokeFunc();
			}
			
			let paramsValid = details.params.reduce(
				(soFar, param) => soFar && param.validate(this.paramValues[param.config.key]),
				true);
			
			if (paramsValid) {
				let args = {};
				details.parameters.forEach(param => {
					args[param['webSocketID']] = this.paramValues[param.config.key];
				});
				
				return this.obs.send(details.request, args);
			} else {
				return Promise.resolve();
			}
		}
	}
	
	return {
		configEntityClass,
		funcClass,
	};
}

module.exports = {
	makeObsFunction,
	Validators,
	ObsFunctionParameter,
};
