import { ModuleClient } from "/common/moduleClient.mjs";


const MAX_PROGRESS = 1920;

function pixelStringToInt(pixelString) {
    return parseInt(pixelString.replace("px", ""))
}


class StreamRaiders extends ModuleClient {
    constructor() {
        super('Stream Raiders');

        this.elements = {
            traveled: document.getElementById('traveled'),
            progressPanel: document.getElementById('progress-panel'),
            progressSP: document.getElementById('progress-sp'),
            progressSPContainer: document.getElementById('progress-sp-container'),
            characters: document.getElementById('characters'),
        };

        let charactersStyle = getComputedStyle(this.elements.characters);
        this.charactersInitialPosition = {
            left: pixelStringToInt(charactersStyle.left),
            top: pixelStringToInt(charactersStyle.top),
        }
    }

    setProgress(pixelProgress, sp) {
        pixelProgress = Math.min(pixelProgress, MAX_PROGRESS);
        this.elements.traveled.style.clipPath = `inset(0 ${1920 - pixelProgress}px 0 0)`;
        let centeredLeft = `${pixelProgress - 1920 / 2 - 11}px`;
        this.elements.progressPanel.style.left = centeredLeft;
        this.elements.progressSPContainer.style.left = centeredLeft;
        this.elements.progressSP.textContent = sp.toString();
        this.elements.characters.style.left = `${this.charactersInitialPosition.left + pixelProgress}px`;
    }

    start() {
        this.server.on('setPixelProgress', (data) => this.setProgress(data['pixelProgress'], data['sp']));

        this.server.attach();
    }
}

const sr = new StreamRaiders();
sr.start();
window.sr = sr;
