// import { ModuleClient } from "/common/moduleClient.mjs";


// const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
// const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;
// const NO_IMAGE_OBJECT = {url: NO_IMAGE};


// Function to set the progress of the progress bar
export function setProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    progressBar.style.clipPath = `inset(0% ${progress < 100 ? 100 - progress : -1}% 0% 0%)`;

    // Adjust the position of the progress text
    const progressContainer = document.getElementById('progress-container');
    const containerWidth = progressContainer.offsetWidth;
    const newRight = containerWidth * (1 - progress / 100) + 5; // 5px for margin
    progressText.style.left = "";
    progressText.style.right = `${Math.max(newRight, 5)}px`; // Ensure it doesn't go out of bounds

    progressText.textContent = `${progress}%`;
}

const iframe = document.getElementById('frame');

function send(eventName, arg) {
    iframe.contentWindow.postMessage([eventName, arg], "*");
}

window.send = send;

window.t = {
    start: () => send("start"),
    end: () => send("end"),
    throwIn: (skinName) => send("throwIn", skinName),
};

window.sp = setProgress;






/*
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
*/
