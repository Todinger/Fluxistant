
const OFF_IMAGE_NAME = 'Off.png';
const ON_IMAGE_NAME = 'Off.png';
const INVALID_IMAGE_NAME = 'Invalid.png';

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
			off: 'images/Off.png',
			on: 'images/On.png',
			invalid: 'images/Invalid.png',
		};
		
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
		$('#ghostName').text(name);
		$('#ghostNameContainer').css('opacity', 1);
	}
	
	hideName() {
		$('#ghostNameContainer').css('opacity', 0);
	}
	
	start() {
		this.server.on('hide', () => this.hide());
		this.server.on('show', () => this.show());
		
		this.server.on('state', state => {
			if (state.ghostName) {
				this.showName(state.ghostName);
			} else {
				this.hideName();
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
