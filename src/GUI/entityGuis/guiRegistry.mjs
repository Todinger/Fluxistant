class GuiRegistryClass {
	constructor() {
		this.guiBuilders = {};
	}
	
	register(guiClass) {
		if (!guiClass) throw 'Invalid definer class registered.';
		
		let guiType = guiClass.GUITYPE;
		console.assert(guiType, `GUI builder registration missing a GUITYPE value.`)
		
		if (!guiType) throw 'Abstract or invalid definer class registered.';
		if (guiType in this.guiBuilders) throw `Duplicate registration for GUI type '${guiType}'.`
		
		this.guiBuilders[guiType] = guiClass.BUILDER;
	}
	
	buildGui(entity, guiID, modName, guiType) {
		guiType = guiType || (entity && entity.constructor && entity.constructor.GUITYPE);
		console.assert(
			guiType && guiType in this.guiBuilders,
			`Unknown GUI type: ${guiType}.`);
		
		return this.guiBuilders[guiType](entity, guiID, modName);
	}
}

const GuiRegistry = new GuiRegistryClass();
export default GuiRegistry;
