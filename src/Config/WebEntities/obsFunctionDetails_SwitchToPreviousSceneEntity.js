const ObsFunctionDetails_BaseEntity = require('./obsFunctionDetails_BaseEntity');

class ObsFunctionDetails_SwitchToPreviousSceneEntity extends ObsFunctionDetails_BaseEntity {
	static get TYPE()		{ return 'ObsFunctionDetails_SwitchToPreviousScene'; 					}
	static get BUILDER()	{ return () => new ObsFunctionDetails_SwitchToPreviousSceneEntity(); 	}
	
	constructor() {
		super('Switch to Previous Scene');
		this.setDescription('Changes the currently displayed scene to the last scene it was before the current one');
	}
}

module.exports = ObsFunctionDetails_SwitchToPreviousSceneEntity;
