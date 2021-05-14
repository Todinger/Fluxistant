const ObsFunctionDetails_BaseEntity = require('./obsFunctionDetails_BaseEntity');

class ObsFunctionDetails_SetSourceVisibilityEntity extends ObsFunctionDetails_BaseEntity {
	static get TYPE()		{ return 'ObsFunctionDetails_SetSourceVisibility'; 					}
	static get BUILDER()	{ return () => new ObsFunctionDetails_SetSourceVisibilityEntity(); 	}
	
	constructor(data) {
		super('Set Current Scene');
		this.setDescription('Changes the currently displayed scene');
		this.addCustomChoice('sceneName', {
			source: 'obsScenes',
			value: data && data.value,
		})
		.setName('Scene Name')
		.setDescription('Name of the scene as it appears in OBS');
		
		this.setData(data);
	}
	
	setData(data) {
		if (data && data.value) {
			this.getChild('sceneName').setValue(data.value);
		}
	}
}

module.exports = ObsFunctionDetails_SetSourceVisibilityEntity;
