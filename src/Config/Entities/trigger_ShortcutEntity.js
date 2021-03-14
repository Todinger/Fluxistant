const TriggerEntity = require('./triggerEntity');

class Trigger_ShortcutEntity extends TriggerEntity {
	static get TYPE()		{ return 'Trigger_Shortcut'; 							}
	static get BUILDER()	{ return (...p) => new Trigger_ShortcutEntity(...p); 	}
	
	constructor(data) {
		super('Key Shortcut');
		this.setDescription('Activates this function when pressing one of a set of keyboard shortcuts');
		this.addDynamicArray('keys', 'KeyShortcut')
			.setName('Shortcuts')
			.setDescription('List of keyboard shortcuts that will activate this trigger');
		
		this.setData(data);
	}
	
	setData(data) {
		super.setData(data);
		if (data && data.keys) {
			let shortcut = this.getChild('keys');
			data.keys.forEach(sequence => shortcut.add(sequence));
		}
	}
}

module.exports = Trigger_ShortcutEntity;
