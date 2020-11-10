
const DEFAULTS = {
	color: 'black',
};

class CreepyText extends EffectClient {
	constructor() {
		super('Creepy');
	}
	
	start() {
		this.on('showText', textData => {
			applyDefaults(textData, DEFAULTS);
			$('body').css('color', textData.color);
			$('#textContainer').text(textData.text);
		});
		
		this.on('hideText', () => {
			$('body').css('color', DEFAULTS.color);
			$('#textContainer').text('');
		});
	}
}

var ct = new CreepyText();
ct.start();
