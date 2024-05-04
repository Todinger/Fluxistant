import { ModuleClient } from "/common/moduleClient.mjs";


class StreamRaiders extends ModuleClient {
    constructor() {
        super('Stream Raiders');
        this.elements = {
            traveled: document.getElementById('traveled'),
            progressPanel: document.getElementById('progress-panel'),
            progressSP: document.getElementById('progress-sp'),
            progressSPContainer: document.getElementById('progress-sp-container'),
        };
    }

    setProgress(pixelProgress, sp) {
        this.elements.traveled.style.clipPath = `inset(0 ${1920 - pixelProgress}px 0 0)`;
        let centeredLeft = `${pixelProgress - 1920 / 2 - 11}px`;
        this.elements.progressPanel.style.left = centeredLeft;
        this.elements.progressSPContainer.style.left = centeredLeft;
        this.elements.progressSP.textContent = sp.toString();
    }

    start() {
        this.server.on('setPixelProgress', (data) => this.setProgress(data['pixelProgress'], data['sp']));

        this.server.attach();
    }
}

const sr = new StreamRaiders();
sr.start();
window.sr = sr;
