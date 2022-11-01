const StaticObjectEntity = require('././staticObjectEntity');

class MediaTextDisplayEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'MediaTextDisplay'; 					}
	static get BUILDER()	{ return () => new MediaTextDisplayEntity(); 	}
	
	constructor() {
		super();
		this.addString('text', '')
			.setName('Text')
			.setDescription('Text to display');
		this.addColor('color', '#000000')
			.setName('Color')
			.setDescription('Text color');
		this.addNonNegativeNumber('duration')
			.setName('Duration')
			.setDescription('Duration in seconds that the text will be displayed')
			.setAdvanced();
	}
}

module.exports = MediaTextDisplayEntity;
