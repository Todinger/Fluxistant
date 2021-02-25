const Module = requireMain('module');

const GHOST_DATA_FILE = 'ghostData.json';

class Phasmophobia extends Module {
	constructor() {
		super({
			name: 'Phasmophobia',
			webname: 'phasmophobia',
			source: 'phasmophobia.html',
		});
		
		this.ghostData = {};
		this.evidenceList = [
			"EMF 5",
			"Spirit Box",
			"Fingerprints",
			"Ghost Orb",
			"Ghost Writing",
			"Freezing Temperatures",
		];
		
		this.evidence = {
			emf5: {
				name: "EMF 5",
				shortcuts: [],
			}
		}
	}
	
	validateData(ghostData) {
	
	}
	
	defineModConfig(modConfig) {
		// let shortcuts = modConfig.addKeyShortcuts('keys');
		// shortcuts.addShortcut('emf5', ['1'])
		// 	.setName('Toggle EMF 5')
		// 	.setDescription('Toggles the EMF 5 piece of evidence');
	}
	
	loadModConfig(conf) {
		// this.log('a');
		//
		// Object.keys(conf.keys).forEach(keyFunction => {
		// 	for (let i = 0; i < conf.keys[keyFunction].length; i++) {
		// 		let shortcut = conf.keys[keyFunction][i];
		// 		let id = `${keyFunction}[${i}]`;
		// 		let shortcutKeycodes = shortcut.map(
		// 			key => {
		// 				let keyCode = 'VC_' + key.toUpperCase();
		// 				assert(
		// 					keyCode in Module.Keycodes,
		// 					`Unknown key: ${key}`);
		//
		// 				return Module.Keycodes[keyCode];
		// 			});
		//
		// 		this.registerShortcutKey(
		// 			id,
		// 			shortcutKeycodes,
		// 			() => this.broadcastEvent('theySayDoThis', "Any single value")
		// 		);
		// 	}
		// });
		//
		// conf.keys.emf5.forEach(shortcut => {
		// });
	}
	
	loadData() {
		this.ghostData = this.readJSON(GHOST_DATA_FILE);
	}
	
	addEvidence(evidence) {
		this.log(`Added evidence: ${evidence}`);1
	}
	
	removeEvidence(evidence) {
	
	}
	
	guessGhost(user, ghost) {
	
	}
	
	load() {
		// On Ctrl + WinKey + Numpad Add
		this.registerShortcutKey(
			'doThis',
			[
				Module.Keycodes.VC_CONTROL_L,
				Module.Keycodes.VC_META_L,
				Module.Keycodes.VC_KP_ADD
			],
			() => this.broadcastEvent('theySayDoThis', "Any single value")
		);
	}
	
	commands = {
		['guess']: {
			name: 'Guess',
			description: 'Guess what the ghost is going to be',
			callback: (user, ghost) => this.guessGhost(user, ghost),
		},
	}
	
	shortcuts = {
		addEMF5: {
			name: 'Add Evidence: EMF Level 5',
			description: 'Adds EMF Level 5 as a piece of evidence for the current ghost',
			keys: [
				['1'], // The 1 key on the keyboard
			],
			callback: () => this.addEvidence('emf5'),
		},
		removeEMF5: {
			name: 'Remove Evidence: EMF Level 5',
			description: 'Removes EMF Level 5 as a piece of evidence for the current ghost',
			keys: [
				['SHIFT_L', '1'], // Shift+1
			],
			callback: () => this.addEvidence('emf5'),
		},
	}
}

module.exports = new Phasmophobia();
