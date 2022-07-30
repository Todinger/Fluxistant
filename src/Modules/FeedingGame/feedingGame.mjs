import { ModuleClient } from "/common/moduleClient.mjs";
import { inRange } from "/common/clientUtils.mjs";

const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;

class TreasureHuntClient extends ModuleClient {
	constructor() {
		super('Feeding Game');
		
		this.images = {
			backClosed: "",
			backOpen: "",
			frontClosed: "",
			frontOpen: "",
		};
		
		this.forms = {
			open: $('#open'),
			closed: $('#closed'),
		};
		
		this.foodImage = $('#food');
		this.setFoodImage(); // Clear the food image
	}
	
	makeCell() {
		let jContainer = $('<div class="grid-item container"></div>');
		let jSub = $('<div class="sub"></div>').appendTo(jContainer);
		let jContents = $(`<img class="center sq" alt="Missing Image" src="${this.stateImages.empty}">`).appendTo(jSub);
		
		return {
			container: jContainer,
			contents: jContents,
		};
	}
	
	initGame(height, width) {
		this.size = {width, height};
		
		let evContainer = $('#cells');
		evContainer.empty();
		
		// Set the grid CSS properties to support the number of columns we want
		let styleString = '';
		styleString += `grid-template-columns: ${'auto '.repeat(width)}; `;
		styleString += `grid-template-rows: ${'1fr '.repeat(height)}; `;
		styleString += `grid-template-areas: ${`'${"main ".repeat(width)}'`.repeat(height)}; `;
		evContainer[0].style = styleString;
		// evContainer.css('grid-template-columns', 'auto '.repeat(width));
		// evContainer.css('grid-template-rows', 'auto ' + '1fr '.repeat(height));
		// evContainer.css('grid-template-areas', `'${'header '.repeat(width)}' ${`'${'main'.repeat(width)}'`.repeat(height)}`);
		
		// evContainer.append($(TITLE));
		
		this.cells = [];
		for (let row = 0; row < height; row++) {
			let rowCells = [];
			for (let col = 0; col < width; col++) {
				let cell = this.makeCell();
				rowCells.push(cell);
				evContainer.append(cell.container);
			}
			
			this.cells.push(rowCells);
		}
		
		this.hide();
	}
	
	hide() {
		$('#all').hide();
	}
	
	show() {
		$('#all').show();
	}
	
	locationValid(row, col) {
		return inRange(0, row, this.size.height - 1) && inRange(0, col, this.size.width - 1);
	}
	
	setState(row, col, state) {
		console.assert(this.locationValid(row, col), `Cell indices out of bounds: [${row}, ${col}] outside ${this.size.height} x ${this.size.width} board`);
		console.assert(state in this.stateImages, `Unknown state: ${state}`);
		
		this.cells[row][col].contents.attr('src', this.stateImages[state]);
	}
	
	handleInitGameMessage(data) {
		if (!data) {
			this.server.emit('error', 'Empty data object received.');
			return false;
		}
		
		if (isNaN(data.height) || isNaN(data.width)) {
			this.server.emit('error', 'Missing board size parameter(s).');
			return false;
		}
		
		this.initGame(data.height, data.width);
		this.show();
		return true;
	}
	
	handleSetStateMessage(data) {
		if (!data) {
			this.server.emit('error', 'Empty data object received.');
			return;
		}
		
		if (isNaN(data.row) || isNaN(data.col)) {
			this.server.emit('error', 'Not all cell indices present.');
			return;
		}
		
		let row = data.row - 1;
		let col = data.col - 1;
		if (!this.locationValid(row, col)) {
			this.server.emit('error', `Invalid location: [${data.row}, ${data.col}] is outside ${this.size.height} x ${this.size.width} board`);
			return;
		}
		
		if (!data.state) {
			this.server.emit('error', 'Missing state value.');
			return;
		}
		
		if (!(data.state in this.stateImages)) {
			this.server.emit('error', `Unknown state value: ${data.state}`);
			return;
		}
		
		this.setState(row, col, data.state);
	}
	
	open() {
		this.forms.open.show();
		this.forms.closed.hide();
	}
	
	close() {
		this.forms.closed.show();
		this.forms.open.hide();
	}
	
	setLevelImage(data, name) {
		$(`#${name}`).attr('src', name in data ? data[name].url : NO_IMAGE);
	}
	
	setLevelImages(data, noResponse) {
		if (!data) {
			return;
		}
		
		this.setLevelImage(data, 'backClosed');
		this.setLevelImage(data, 'backOpen');
		this.setLevelImage(data, 'frontClosed');
		this.setLevelImage(data, 'frontOpen');
		
		if (!noResponse) {
			this.server.emit('levelImagesSet');
		}
	}
	
	setFoodImage(image) {
		this.foodImage.attr('src', image ? image.url : NO_IMAGE);
	}
	
	feed(data) {
		this.setFoodImage(data);
		this.open();
		this.foodImage.show();
		setTimeout(() => {
			this.foodImage.hide();
			this.close();
			this.server.emit('feedDone');
		}, 100);
	}
	
	start() {
		this.close();
		this.hide();
		
		this.server.on('hide', () => this.hide());
		this.server.on('show', () => this.show());
		this.server.on('setLevelImages', data => this.setLevelImages(data));
		this.server.on('feed', data => this.feed(data));
		this.server.on('sync', data => {
			this.setLevelImages(data, true);
			this.show();
		});
		
		this.server.attach();
		
		this.server.emit('syncState');
	}
}

const thc = new TreasureHuntClient();
thc.start();
