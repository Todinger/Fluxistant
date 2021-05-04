const StaticObjectEntity = requireConfig('./staticObjectEntity');

class WheelEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'Wheel'; 					}
	static get BUILDER()	{ return () => new WheelEntity(); 	}
	
	constructor() {
		super();
		this.addString('title')
			.setName('Title')
			.setDescription('Title text to show above this wheel');
		
		let wheelData = this.addGroup('wheelData')
			.setName('Wheel Data')
			.setDescription('Information about the wheel itself (not its contents)');
		wheelData.addNaturalNumber('outerRadius', 200)
			.setName('Outer Radius')
			.setDescription('The size of the wheel');
		wheelData.addInteger('offsetX', 0)
			.setName('Center X Offset')
			.setDescription('Offset of the center of the wheel on the X axis from the screen center');
		wheelData.addInteger('offsetY', 0)
			.setName('Center Y Offset')
			.setDescription('Offset of the center of the wheel on the Y axis from the screen center');
		wheelData.addNaturalNumber('textFontSize', 28)
			.setName('Text Size')
			.setDescription('Font size for the text on the wheel');
		
		this.add('video', 'Video')
			.setName('Starting Video')
			.setDescription('Video to play on the screen before showing the wheel');
		
		this.addDynamicArray('segments', 'WheelSegment')
			.setName('Slots')
			.setDescription('All the options displayed on the wheel');
		
		this.add('showFunction', 'Function', {
			name: 'Show Wheel',
			description: 'Shows this wheel (only works if no other wheel is showing)',
		});
			// .setName('Show Wheel Function')
			// .setDescription('Shows this wheel (only works if no other wheel is showing)');
	}
}

module.exports = WheelEntity;
