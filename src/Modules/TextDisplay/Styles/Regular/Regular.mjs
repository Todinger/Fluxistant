import { ModuleClient } from "/common/moduleClient.mjs";
import { applyDefaults } from "/common/clientUtils.mjs";

const DEFAULTS = {
	fontSize: 100,
	color: '#000',
	strokeSize: 0,
	strokeColor: '#000',
	xShift: 0,
	yShift: 0,
};

class RegularText extends ModuleClient {
	constructor() {
		super('Regular');
		this.textContainer = $('#textContainer');
	}
	
	start() {
		this.on('showText', textData => {
			applyDefaults(textData, DEFAULTS);
			// let top = `${}`
			$('body').css({
				'color': textData.color,
				'font-size': textData.fontSize,
				'-ms-transform': `translate(${textData.xShift}vw, ${-textData.yShift}vw)`,
				'transform': `translate(${textData.xShift}vw, ${-textData.yShift}vw)`,
			});
			this.textContainer.css({
				'-webkit-text-stroke': `${textData.strokeSize}px ${textData.strokeColor}`,
			});
			this.textContainer.text(textData.text);
		});
		
		this.on('hideText', () => {
			$('body').css('color', DEFAULTS.color);
			$('#textContainer').text('');
		});
	}
}

const rt = new RegularText();
rt.start();
