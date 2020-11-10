
// Gets a list of all the keys that are in obj1 and not in obj2
function getSubKeys(obj1, obj2) {
	var k1 = Object.keys(obj1);
	return k1.filter(function(x) {
		return obj2[x] === undefined;
	});
}

const subtractArrays = (arr1, arr2) => arr1.filter(el => !arr2.includes(el));

class DisplayEffects {
	static DEFAULT() {
		return DisplayEffects.appear;
	}
	
	static get appear() {
		return {
			show: function(jTarget, displayEffectData) {
				jTarget.show();
			},
			hide: function(jTarget, displayEffectData, onDone) {
				jTarget.hide();
				if (onDone) {
					onDone();
				}
			},
			duration: function(displayEffectData) {
				return 0;
			},
		}
	}
	static get fade() {
		return {
			DEFAULTS: {
				duration: 1000,
			},
			show: function(jTarget, displayEffectData) {
				applyDefaults(displayEffectData, DisplayEffects.fade.DEFAULTS);
				jTarget.fadeIn(displayEffectData.duration);
			},
			hide: function(jTarget, displayEffectData, onDone) {
				jTarget.fadeOut(displayEffectData.duration, () => {
					if (onDone) {
						onDone();
					}
				});
			},
			duration(displayEffectData) {
				let res =
					displayEffectData.duration ||
					DisplayEffects.fade.DEFAULTS.duration;
				return res;
			},
		}
	}
}

const TEXTDATA_DEFAULTS = {
	duration: 5000,
	displayEffect: {
		name: 'appear',
	},
}

class TextDisplay extends EffectClient {
	constructor() {
		super('Text Display');
		this.styles = {};
	}
	
	addFrame(styleName, styleURL) {
		let frame = $(`<div id="style_${styleName}" class="framediv"><iframe src="${styleURL}" frameborder="0" allowtransparency="yes" scrolling="no"></iframe></div>`);
		
		frame.appendTo($('#frames'));
		return frame;
	}
	
	getStyle(styleName) {
		console.assert(styleName in this.styles, `Unknown style: ${styleName}`);
		return this.styles[styleName];
	}
	
	showText(textData) {
		let displayEffect = DisplayEffects[textData.displayEffect.name];
		let style = this.getStyle(textData.style);
		let jFrame = style.frame;
		displayEffect.show(
			jFrame,
			textData.displayEffect);
		
		this.notifyChild(textData.style, 'showText', textData);
		setTimeout(() => {
			displayEffect.hide(
				jFrame,
				textData.displayEffect,
				() => {
					this.notifyChild(textData.style, 'hideText');
					this.freeBlockingEvent('Text');
				});
			
		},
		textData.duration - displayEffect.duration(
			textData.displayEffect));
	}
	
	soundDone() {
		this.freeBlockingEvent('Sound');
	}
	
	playSound(url) {
		let sound = new Audio(url);
		$(sound).on('ended', () => this.soundDone());
		sound.play().catch(() => this.soundDone());
	}
	
	processRequest(textData) {
		this.showText(textData);
		
		if (textData.sound) {
			this.playSound(textData.sound);
		}
	}
	
	start() {
		// Expects an array of names
		this.server.on('styleList', styleList => {
			this.log('Received style list.');
			
			let stylesToRemove = subtractArrays(Object.keys(this.styles), styleList);
			stylesToRemove.forEach(styleName => {
				this.styles[styleName].frame.remove();
				delete this.styles[styleName];
			});
			
			let stylesToAdd = subtractArrays(styleList, Object.keys(this.styles));
			stylesToAdd.forEach(styleName => {
				let styleURL = `./Styles/${styleName}/${styleName}.html`;
				this.styles[styleName] = {
					name: styleName,
					url: styleURL,
					frame: this.addFrame(styleName, styleURL),
				};
			});
		});
		
		this.server.on('showText', textData => {
			if (typeof textData === 'string') {
				textData = {
					text: textData,
					style: 'Regular',
				};
			}
			
			console.assert(textData.style && textData.text,
				`Bad showText request: ${textData}`);
			console.assert(textData.style in this.styles,
				`Unknown style: ${textData.style}`);
			
			applyDefaults(textData, TEXTDATA_DEFAULTS);
			
			let displayEffect = DisplayEffects[textData.displayEffect.name];
			console.assert(
				textData.duration >=
				2 * displayEffect.duration(textData.displayEffect),
				`Text display effect exceeds its display time.`);
			
			let blockingEvents = ['Text'];
			
			if (textData.sound) {
				blockingEvents.push('Sound');
			}
			
			this.performBlockingEvent(
				blockingEvents,
				() => this.processRequest(textData));
		});
		
		this.server.onAttached(() => this.server.emit('getStyleList'));
		
		this.server.attach();
		this.server.attachToTag('textdisp');
	}
}

var td = new TextDisplay();
td.start();
