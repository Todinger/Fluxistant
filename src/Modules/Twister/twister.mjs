import { ModuleClient } from "/common/moduleClient.mjs";


// const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;
// const NO_IMAGE_OBJECT = {url: NO_IMAGE};


class Twister extends ModuleClient {
    constructor() {
        super('Twister');
    }

    windowLoaded() {
        this.toIdle();
    }

    start() {
        // this.server.on('setData', (data) => this.setData(data));
        this.server.attach();
    }
}

const t = new Twister();
t.start();
window.t = t;
