const Module = requireMain('module');
const StreamRaidersManager = requireMain('streamRaidersManager');

const MAX_PIXEL_PROGRESS = 1920;

class StreamRaiders extends Module {
	constructor() {
		super({
			name: 'Stream Raiders',
			webname: 'streamRaiders',
			source: 'streamRaiders.html',
		});
	}
	
	load() {
		this.onClientAttached(_socket => {
			// socket.on('feedDone', () => {
			// 	if (this.running) {
			// 		this.events._notify('feedDone');
			// 	}
			// });
			// socket.on('levelImagesSet', () => {
			// 	if (this.running) {
			// 		this.events._notify('levelImagesSet');
			// 	}
			// });
			// socket.on('syncState', () => {
			// 	if (this.running) {
			// 		this.setLevelImages(this.getCurrentLevelImages(), 'sync');
			// 	}
			// })

			if (this.running) {
				// this.setLevelImages(this.getCurrentLevelImages(), 'sync');
			}
		});

		StreamRaidersManager.onSkinathonPointsChanged(
			(newPoints, oldPoints) => this._skinathonPointsChanged(newPoints, oldPoints)
		);
	}

	_skinathonPointsChanged(newPoints, _oldPoints) {
		if (newPoints < 0) return;
		const MAX_SP = 100;
		if (newPoints > MAX_SP) newPoints = MAX_SP;
		let pixelProgress = Math.round((newPoints / MAX_SP) * MAX_PIXEL_PROGRESS);
		this.broadcastEvent('setPixelProgress', {pixelProgress, sp: newPoints});
	}
}

module.exports = new StreamRaiders();
