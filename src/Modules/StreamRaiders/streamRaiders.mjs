import { ModuleClient } from "/common/moduleClient.mjs";


const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;
const NO_IMAGE_OBJECT = {url: NO_IMAGE};
const MAX_PROGRESS = 1920;

function pixelStringToInt(pixelString) {
    return parseInt(pixelString.replace("px", ""))
}

function getImageFromData(imageData) {
    imageData = imageData || {};
    let result = {
        url: imageData['url'] || NO_IMAGE,
    };

    if (imageData['width']) {
        result.width = imageData['width'];
    }

    if (imageData['height']) {
        result.height = imageData['height'];
    }

    return result;
}

function setImageAttributes(imageElement, attributes) {
    if (attributes.url) {
        imageElement.src = attributes.url;
    }

    imageElement.style.width = isNaN(attributes.width) ? "" : `${attributes.width}px`;
    imageElement.style.height = isNaN(attributes.height) ? "" : `${attributes.height}px`;
}


class Character {
    constructor(element) {
        this._element = element;
        this._idle = NO_IMAGE_OBJECT;
        this._moving = NO_IMAGE_OBJECT;
        this._attacking = NO_IMAGE_OBJECT;
    }

    setImages(data) {
        if (data) {
            this._idle = getImageFromData(data['idle']);
            this._moving = getImageFromData(data['moving']);
            this._attacking = getImageFromData(data['attacking']);
        }
        this.toIdle();
    }

    toIdle() {
        setImageAttributes(this._element, this._idle);
    }

    toMoving() {
        setImageAttributes(this._element, this._moving);
    }

    toAttacking() {
        setImageAttributes(this._element, this._attacking);
    }
}


class Milestone {
    constructor(data) {
        data = data || {};
        let bg = data['bg'] || {};
        this.bg = {
            locked: getImageFromData(bg['locked']),
            unlocked: getImageFromData(bg['unlocked']),
        }

        let reward = data['reward'] || {};
        this.reward = {
            image: getImageFromData(reward['image']),
            offsetX: reward['offsetX'] || 0,
            offsetY: reward['offsetY'] || 0,
        }

        let enemy = data['enemy'] || {};
        this.enemy = {
            image: getImageFromData(enemy['image']),
            deathImage: getImageFromData(enemy['deathImage']),
            offsetX: enemy['offsetX'] || 0,
            offsetY: enemy['offsetY'] || 0,
        }
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

        this.firstMilestonePos = 0;
        this.lastMilestonePos = MAX_PROGRESS;
        this.milestones = [];
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

    setMilestoneData(milestoneData) {
        if (!milestoneData) return;
        this.firstMilestonePos = milestoneData['firstMilestonePos'] || 0;
        this.lastMilestonePos = milestoneData['lastMilestonePos'] || 0;

        let milestones = milestoneData['milestones'] || [];
        if (!Array.isArray(milestones)) {
            console.error(`Bad milestone data received. Expected an array, got: ${typeof milestones}`);
            return;
        }

        this.milestones = milestones.map(data => new Milestone(data));
    }

    setData(data) {
        if (!data) return;
        this.setCharacterImages(data['characters']);
        this.setMilestoneData(data['milestones']);
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
        this.server.on('setData', (data) => this.setData(data));

        this.server.attach();
    }
}

const sr = new StreamRaiders();
sr.start();
window.sr = sr;
