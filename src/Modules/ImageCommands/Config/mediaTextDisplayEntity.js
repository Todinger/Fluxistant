const StaticObjectEntity = requireConfig('./staticObjectEntity');

class MediaTextDisplayEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'MediaTextDisplay'; 					}
	static get BUILDER()	{ return () => new MediaTextDisplayEntity(); 	}
	
	constructor() {
		super();
		this.addString('text', '')
			.setName('Text')
			.setDescription('Text to display');
		this.addString('font', 'impact, sans-serif')
			.setName('Font')
			.setDescription('Text to display');
		this.addNaturalNumber('fontSize', 100)
			.setName('Font Size')
			.setDescription('How large to make the displayed text');
		this.addColor('color', '#000000')
			.setName('Color')
			.setDescription('Text color');
		this.addColor('strokeColor', '#000000')
			.setName('Stroke Color')
			.setDescription('Color of the stroke applied to the text, if any');
		this.addNaturalNumber('strokeSize', 0)
			.setName('Stroke Width')
			.setDescription('How large to make the stroke on the text (set to 0 for no stroke)');
		this.addInteger('xShift', 0)
			.setName('Horizontal Shift')
			.setDescription('Move the text on the horizontal axis (-50 for left edge of screen, 50 for right edge)');
		this.addInteger('yShift', 0)
			.setName('Vertical Shift')
			.setDescription('Move the text on the vertical axis (-50 for bottom of screen, 50 for top)');
		this.addDuration('duration', 5)
			.setName('Duration')
			.setDescription('Duration in seconds that the text will be displayed')
			.setAdvanced();
	}
}

module.exports = MediaTextDisplayEntity;
