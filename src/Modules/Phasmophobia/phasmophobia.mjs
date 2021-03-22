import { ModuleClient } from "/common/moduleClient.mjs";

const IMAGE_DIR = 'images/';
const GHOSTS_DIR = IMAGE_DIR + 'Ghosts/';

class PhasmophobiaClient extends ModuleClient {
	constructor() {
		super('Phasmophobia');
		
		this.hide();
		
		this.images = {
			emf5:   {},
			box:    {},
			prints: {},
			orb:    {},
			book:   {},
			temps:  {},
		};
		
		this.stateImages = {
			off: IMAGE_DIR + 'Off.png',
			on: IMAGE_DIR + 'On.png',
			invalid: IMAGE_DIR + 'Invalid.png',
		};
		
		this.ghosts = {
			banshee: GHOSTS_DIR + "Banshee.png",
			demon: GHOSTS_DIR + "Demon.png",
			jinn: GHOSTS_DIR + "Jinn.png",
			mare: GHOSTS_DIR + "Mare.png",
			oni: GHOSTS_DIR + "Oni.png",
			phantom: GHOSTS_DIR + "Phantom.png",
			poltergeist: GHOSTS_DIR + "Poltergeist.png",
			revenant: GHOSTS_DIR + "Revenant.png",
			shade: GHOSTS_DIR + "Shade.png",
			spirit: GHOSTS_DIR + "Spirit.png",
			wraith: GHOSTS_DIR + "Wraith.png",
			yurei: GHOSTS_DIR + "Yurei.png",
		}
		
		this.ghostImage = $('#ghost');
		this.ghostContainer = $('#ghostContainer');
		
		this.createAll();
	}
	
	createEvidence(ev) {
		let jContainer = $('<div class="grid-item container"></div>');
		let jSub = $('<div class="sub"></div>').appendTo(jContainer);
		let jBack = $(`<img class="center sq" alt="Missing Image" src="${this.stateImages.off}">`).appendTo(jSub);
		let jFront = $(`<img class="center sq" alt="Missing Image" src="images/${ev}.png">`).appendTo(jSub);
		this.images[ev] = {
			container: jContainer,
			back: jBack,
			front: jFront,
		};
		
		return jContainer;
	}
	
	createAll() {
		let evContainer = $('#evidence');
		Object.keys(this.images).forEach(ev => {
			evContainer.append(this.createEvidence(ev));
		});
		
		// Move the ghost type display to the end so that it
		// shows on top of the evidence
		evContainer.append(this.ghostContainer);
	}
	
	hide() {
		$('#all').hide();
	}
	
	show() {
		$('#all').show();
	}
	
	setState(ev, state) {
		this.images[ev].back.attr('src', this.stateImages[state]);
	}
	
	showName(name) {
		$('#name').text(name);
		$('#nameContainer').css('opacity', 1);
	}
	
	hideName() {
		$('#nameContainer').css('opacity', 0);
	}
	
	showGhost(ghost) {
		this.ghostImage.attr('src', '');
		this.ghostImage.attr('src', this.ghosts[ghost]);
		this.ghostImage.show();
	}
	
	hideGhost() {
		this.ghostImage.hide();
		this.ghostImage.attr('src', '');
	}
	
	start() {
		this.server.on('hide', () => this.hide());
		this.server.on('show', () => this.show());
		
		this.server.on('state', state => {
			if (state.name) {
				this.showName(state.name);
			} else {
				this.hideName();
			}
			
			if (state.ghost) {
				this.showGhost(state.ghost.toLowerCase());
			} else {
				this.hideGhost();
			}
			
			Object.keys(state.evidence).forEach(ev => {
				this.setState(ev, state.evidence[ev]);
			});
		});
		
		this.server.attach();
	}
}

const pc = new PhasmophobiaClient();
pc.start();
