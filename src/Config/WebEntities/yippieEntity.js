const ImageFileEntity = require('././Assets/imageFileEntity');

class YippieEntity extends ImageFileEntity {
	static get TYPE()		{ return 'Yippie'; 					}
	static get BUILDER()	{ return () => new YippieEntity(); 	}
	
	constructor() {
		super();
		this.addString('yd')
			.setName('ID')
			.setDescription('Unique identifier used for using this Yippie');
	}
}

module.exports = YippieEntity;
