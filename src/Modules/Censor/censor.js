// A jQuery value holding the image element we use for displaying images
var jImageHolder = $('#imageholder');

class Censor extends ModuleClient {
	constructor() {
		super('Censor');
		this.censors = {};
	}
	
	addCensor(id, image) {
		console.assert(!(id in this.censors), `Censor '${id}' already exists.`);
		
		let jImage = $(`<img class="cimage" src="${image.url}">`);
		jImage.css({
			top: `${image.top}px`,
			left: `${image.left}px`
		})
		.hide()
		.appendTo("#imageholder");
		
		jImage.censorVisible = false;
		
		this.censors[id] = jImage;
	}
	
	removeCensor(id) {
		if (id in this.censors) {
			this.censors[id].remove();
			delete this.censors[id];
		}
	}
	
	toggleCensor(id) {
		console.assert(id in this.censors, `Censor '${id}' doesn't exist.`);
		this.censors[id].censorVisible = !this.censors[id].censorVisible;
		if (this.censors[id].censorVisible) {
			this.censors[id].show();
		} else {
			this.censors[id].hide();
		}
	}
	
	showCensor(id) {
		console.assert(id in this.censors, `Censor '${id}' doesn't exist.`);
		this.censors[id].show();
		this.censors[id].censorVisible = true;
	}
	
	hideCensor(id) {
		console.assert(id in this.censors, `Censor '${id}' doesn't exist.`);
		this.censors[id].hide();
		this.censors[id].censorVisible = false;
	}
	
	start() {
		this.server.on('addCensor', censorData => this.addCensor(
			censorData.id,
			censorData.image));
		this.server.on('removeCensor', id => this.removeCensor(id));
		this.server.on('toggleCensor', id => this.toggleCensor(id));
		this.server.on('showCensor', id => this.showCensor(id));
		this.server.on('hideCensor', id => this.hideCensor(id));
		
		this.server.attach();
	}
}

var censor = new Censor();
censor.start();
