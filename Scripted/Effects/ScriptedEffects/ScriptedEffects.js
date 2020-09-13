
// Gets a list of all the keys that are in obj1 and not in obj2
function getSubKeys(obj1, obj2) {
	var k1 = Object.keys(obj1);
	return k1.filter(function(x) {
		return obj2[x] === undefined;
	});
}

class ScriptedEffects extends EffectClient {
	static get FADE_TIME() { return 500; }
	
	constructor() {
		super('ScriptedEffects');
		this.scripts = {};
	}
	
	addFrame(webname, source, zindex) {
		let frame = $(`<div id="script_${webname}" class="framediv"><iframe src="${source}" frameborder="0" allowtransparency="yes" scrolling="no"></iframe></div>`);
		if (zindex !== undefined) {
			frame.css('z-index', zindex);
		}
		
		frame.appendTo($('#frames'));
		return frame;
	}
	
	getScript(scriptName) {
		console.assert(scriptName in this.scripts, `Unknown script: ${scriptName}`);
		return this.scripts[scriptName];
	}
	
	start() {
		// Expects a collection of objects, each with .source and optionally .zindex
		this.server.on('scriptList', scriptList => {
			this.log('Received scripts list.');
			
			let scriptsToRemove = getSubKeys(this.scripts, scriptList);
			scriptsToRemove.forEach(scriptName => {
				this.scripts[scriptName].frame.remove();
				delete this.scripts[scriptName];
			});
			
			let scriptsToAdd = getSubKeys(scriptList, this.scripts);
			scriptsToAdd.forEach(scriptName => {
				this.scripts[scriptName] = {
					name: scriptName,
					source: scriptList[scriptName].source,
					frame: this.addFrame(
						scriptList[scriptName].webname,
						scriptList[scriptName].source,
						scriptList[scriptName].zindex),
				};
			});
		});

		this.server.on('hide', scriptName => {
			this.getScript(scriptName).frame.fadeOut(EffectClient.FADE_TIME);
		});

		this.server.on('show', scriptName => {
			this.getScript(scriptName).frame.fadeIn(EffectClient.FADE_TIME);
		});
		
		this.server.attach();
	}
}

var se = new ScriptedEffects();
se.start();
