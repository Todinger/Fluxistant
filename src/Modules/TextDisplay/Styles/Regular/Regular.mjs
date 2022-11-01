import { ModuleClient } from "/common/moduleClient.mjs";
import { applyDefaults } from "/common/clientUtils.mjs";

const DEFAULTS = {
	color: 'black',
};

class RegularText extends ModuleClient {
	constructor() {
		super('Regular');
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

const rt = new RegularText();
rt.start();
