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


let currentLevel = 1;
const levelElement = document.getElementById('level');
const timerElement = document.getElementById('timer');
const titleElement = document.getElementById('title');


function grow() {
    send("grow");
    levelElement.classList.remove(`ef${currentLevel}`);
    timerElement.classList.remove(`timer-ef${currentLevel}`);
    currentLevel = Math.min(currentLevel + 1, 5);
    levelElement.classList.add(`ef${currentLevel}`);
    timerElement.classList.add(`timer-ef${currentLevel}`);
    levelElement.textContent = `EF${currentLevel}`;
}

window.send = send;

window.t = {
    start: () => send("start"),
    end: () => send("end"),
    throwIn: (skinName) => send("throwIn", skinName),
    grow,
};

window.sp = setProgress;

window.g = function() {
    const level = document.getElementById('level');
    level.classList.add("glowy");
}

const WATCH_TEXT = "🌪️ TORNADO WATCH! 🌪️";
const WARNING_TEXT = "⚠️ TORNADO WARNING! ⚠️";

window.watch = function () {
    titleElement.textContent = WATCH_TEXT;
    titleElement.classList.add("watch");
    titleElement.classList.remove("warn");
}

window.warn = function () {
    titleElement.textContent = WARNING_TEXT;
    titleElement.classList.add("warn");
    titleElement.classList.remove("watch");
}


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
