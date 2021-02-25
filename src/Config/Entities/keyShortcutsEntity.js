const StaticObjectEntity = require('./staticObjectEntity');

class KeyShortcutsEntity extends StaticObjectEntity {
	static get TYPE()		{ return 'KeyShortcuts'; 					}
	static get BUILDER()	{ return () => new KeyShortcutsEntity(); 	}
	
	constructor() {
		// TODO: Switch to keyboard shortcut entity
		super();
	}
	
	addShortcut(key, data) {
		let shortcut = this.addDynamicArray(key, 'KeyShortcut')
			.setName(data.name)
			.setDescription(data.description);
		if (data.keys) {
			data.keys.forEach(sequence => shortcut.add(sequence));
		}
		
		return shortcut;
	}
}

module.exports = KeyShortcutsEntity;
