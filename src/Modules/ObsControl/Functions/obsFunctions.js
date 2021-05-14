const { makeObsFunction, Validators, ObsFunctionParameter } = require('./obsFunctionMaker');
const func = makeObsFunction;
const param = ObsFunctionParameter;

module.exports = [
	func({
		request: 'SetSceneItemProperties',
		config: {
			displayText: 'Set Source Visibility',
			description: 'Makes the selected source visible or invisible in the current scene',
		},
		parameters: param({
			webSocketID: 'visible',
			defaultValue: true,
			config: {
				key: 'visible',
				entityType: 'Boolean',
				name: 'Visible',
				description: 'Specifies whether to make this source visible or invisible',
			},
		}),
	}),
];
