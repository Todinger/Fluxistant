const Module = requireMain('module');

class Counters extends Module {
	constructor() {
		super({
			name: 'Counters',
			enabledByDefault: false,
			configurable: false,
		});
		
		this.counterFunctions = {};
		
		this.data.counters = {};
	}
	
	loadModConfig(conf) {
		this.deactivateFunctions(this.counterFunctions || {});
		
		this.counterFunctions = {};
		if (conf.counterFunctions) {
			for (let i = 0; i < conf.counterFunctions.length; i++) {
				let func = conf.counterFunctions[i];
				let funcObject = this.createFunctionObject(func);
				
				funcObject.action = function() {};
				if (!funcObject.funcID) {
					funcObject.funcID = `CounterFunc[${i}]`;
				}
				
				this.counterFunctions[funcObject.funcID] = funcObject;
			}
		}
		
		this.activateFunctions(this.counterFunctions);
	}
	
	increment(data) {
		
	}
	
	functions = {
		showImage: {
			name: 'Show Image',
			description: 'Shows a randomly selected picture from the image pool.',
			action: data => this.showRandomImage(data.user),
			triggers: [
				this.trigger.command({
					cmdname: 'pixelate',
					cost: 300,
				})
			],
			variables: [
				this.variable.out('imageName', {
					name: 'Image Name (`$image`)',
					description: 'The name of the file image that was chosen for display, without its extension',
					example: '"Showing the beautiful `$image`!" ---When showing "Happy Face.png"---> "Showing the beautiful Happy Face!"',
					expr: '$image',
				}),
			],
			responses: [
				this.response.chat('$cmdname redeemed by $user for $pcost! Showing "$image" by Yecats!'),
			],
			// message: `${_.capitalize(COMMAND_NAME)} redeemed by $user for $pcost! One random drawing by Yecats coming up!`,
		},
	}
}

module.exports = new Counters();
