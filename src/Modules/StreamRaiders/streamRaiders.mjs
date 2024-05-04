import { ModuleClient } from "/common/moduleClient.mjs";


const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;
const MAX_PROGRESS = 1920;

function pixelStringToInt(pixelString) {
    return parseInt(pixelString.replace("px", ""))
}


class Character {
    constructor(element) {
        this._element = element;
        this._idle = NO_IMAGE;
        this._moving = NO_IMAGE;
        this._attacking = NO_IMAGE;
    }

    setImages(data) {
        if (data) {
            this._idle = data['idle'] || NO_IMAGE;
            this._moving = data['moving'] || NO_IMAGE;
            this._attacking = data['attacking'] || NO_IMAGE;
        }
        this.toIdle();
    }

    toIdle() {
        this._element.src = this._idle;
    }

    toMoving() {
        this._element.src = this._moving;
    }

    toAttacking() {
        this._element.src = this._attacking;
    }
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

        this.characters = [null, null, null, null];
        $(".character").each((index, element) => {
            this.characters[index] = new Character(element);
        });
    }

    windowLoaded() {
        this.toIdle();
    }

    setCharacterImages(characters) {
        if (!characters) return;
        if (!Array.isArray(characters)) {
            console.error(`Bad character data received. Expected an array, got: ${typeof characters}`);
            return;
        }

        let usedCharacterCount = Math.min(4, characters.length);
        if (characters.length !== 4) {
            console.warn(`Expected 4 characters; got ${characters.length} instead. Using only the first ${usedCharacterCount} entries.`);
        }

        for (let i = 0; i < usedCharacterCount; i++) {
            this.characters[i].setImages(characters[i]);
        }
    }

    setImages(data) {
        if (!data) return;
        this.setCharacterImages(data['characters']);
    }

    toIdle() {
        Object.values(this.characters).forEach(character => character.toIdle());
    }

    toMoving() {
        Object.values(this.characters).forEach(character => character.toMoving());
    }

    toAttacking() {
        Object.values(this.characters).forEach(character => character.toAttacking());
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
        this.server.on('setImages', (data) => this.setImages(data));

        this.server.attach();
    }
}

const sr = new StreamRaiders();
sr.start();
window.sr = sr;
