// For an entire configuration entity (a module or the main program configuration).
// Currently this is just a raw object configuration GUI, but I'm making it its own
// thing so I can use this for the configuration roots, and if I need something
// different later I'll just change it here.
//
// We're not registering it in the GuiRegistry registry, since we're not going to be
// using it dynamically by type, but rather directly for the top-level objects.
import RawObjectGui from "./rawObjectGui.mjs";

export default class ConfigGui extends RawObjectGui {
	constructor(entity, guiID, modName) {
		super(entity, guiID, modName);
	}
}
