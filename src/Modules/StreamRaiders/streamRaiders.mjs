import { ModuleClient } from "/common/moduleClient.mjs";


const TRANSPARENT_PIXEL_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const NO_IMAGE = TRANSPARENT_PIXEL_IMAGE;
const NO_IMAGE_OBJECT = {url: NO_IMAGE};
const MAX_PROGRESS = 1920;
const DEFAULT_ATTACK_DURATION = 3000;
const DEFAULT_ADVANCEMENT_PIXELS_PER_SEC = 20;

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

function toPixels(num) {
    return num === 0 ? `${num}` : `${num}px`;
}

function toCSSProperties(properties) {
    let result = {};
    for (let prop of ['top', 'left', 'bottom', 'right', 'width', 'height']) {
        if (prop in properties) {
            result[prop] = toPixels(properties[prop]);
        }
    }

    return result;
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

        this.position = data['position'] || 0;

        let bg = data['bg'] || {};
        this.bg = {
            locked: getImageFromData(bg['locked']),
            unlocked: getImageFromData(bg['unlocked']),
        }

        let reward = data['reward'] || {};
        this.reward = {
            image: getImageFromData(reward['image']),
            centerX: reward['centerX'] || 0,
            centerY: reward['centerY'] || 0,
            offsetX: reward['offsetX'] || 0,
            offsetY: reward['offsetY'] || 0,
        }

        let enemy = data['enemy'] || {};
        this.enemy = {
            image: getImageFromData(enemy['image']),
            deathImage: getImageFromData(enemy['deathImage']),
            centerX: enemy['centerX'] || 0,
            centerY: enemy['centerY'] || 0,
            offsetX: enemy['offsetX'] || 0,
            offsetY: enemy['offsetY'] || 0,
        }

        this.jMilestone = null;
        this.jBackground = null;
        this.jReward = null;
        this.jEnemy = null;
    }

    setImageProperties(jImage, properties) {
        jImage.attr("src", properties.url);
        jImage.css(toCSSProperties(properties));
    }

    build() {
        this.jMilestone = $(`<div class="milestone" style="left: ${toPixels(this.position)};"></div>`);
        this.jBackground = $(`<img src="" alt="" class="milestone-item milestone-bg">`)
            .appendTo(this.jMilestone);
        this.setImageProperties(this.jBackground, this.bg.locked);
        this.jReward = $(`<img src="" alt="" class="milestone-item milestone-reward">`)
            .appendTo(this.jMilestone);
        this.setImageProperties(this.jReward, this.reward.image);
        this.jEnemy = $(`<img src="" alt="" class="milestone-item milestone-enemy">`)
            .appendTo(this.jMilestone);
        this.setImageProperties(this.jEnemy, this.enemy.image);

        return this.jMilestone;
    }

    fixPositionFromSettings(jImage, settings) {
        jImage.css(toCSSProperties({
            left: Math.round((-jImage.width() / 2) + settings.centerX + settings.offsetX),
            bottom: Math.round((-jImage.height() / 2) + settings.centerY + settings.offsetY),
        }));
    }

    fixBackgroundPosition() {
        this.jBackground.css(toCSSProperties({
            left: Math.round(-this.jBackground.width() / 2),
            bottom: 0
        }));
    }

    fixPositions() {
        this.fixBackgroundPosition();
        this.fixPositionFromSettings(this.jReward, this.reward);
        this.fixPositionFromSettings(this.jEnemy, this.enemy);
    }

    playEnemyDeath() {
        this.setImageProperties(this.jEnemy, this.enemy.deathImage);
    }

    removeEnemy() {
        this.setImageProperties(this.jEnemy, NO_IMAGE_OBJECT);
    }

    unlock() {
        this.setImageProperties(this.jBackground, this.bg.unlocked);
    }
}


class Event {
    constructor(sr) {
        this.sr = sr;
    }

    perform() {
        // Meant to be overridden by children
    }

    _done() {
        this.sr.eventFinished(this);
    }
}

class AdvanceEvent extends Event {
    constructor(sr, targetPixelProgress, targetSP) {
        super(sr);
        this.targetPixelProgress = targetPixelProgress;
        this.targetSP = targetSP;
    }

    perform() {
        sr.advance(this.targetPixelProgress, this.targetSP, () => this._done());
    }
}

class ConquerEvent extends Event {
    constructor(sr, milestoneIndex) {
        super(sr);
        this.milestoneIndex = milestoneIndex;
    }

    perform() {
        sr.conquerMilestone(this.milestoneIndex, () => this._done());
    }
}


class StreamRaiders extends ModuleClient {
    constructor() {
        super('Stream Raiders');

        this.elements = {
            jRoad: $("#skinathonRoad"),
            traveled: document.getElementById('traveled'),
            progressPanel: document.getElementById('progress-panel'),
            progressSP: document.getElementById('progress-sp'),
            progressSPContainer: document.getElementById('progress-sp-container'),
            characters: document.getElementById('characters'),
            jMilestones: $("#milestones"),
            jAnimator: $("#animator"),
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

        this.milestones = [];

        this.attackDuration = DEFAULT_ATTACK_DURATION;
        this.advancementPixelsPerSecond = DEFAULT_ADVANCEMENT_PIXELS_PER_SEC;
        this.currentSP = 0;
        this.currentPixelProgress = 0;

        this.eventQueue = [];
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

    setMilestoneData(milestones) {
        if (!milestones) return;

        if (!Array.isArray(milestones)) {
            console.error(`Bad milestone data received. Expected an array, got: ${typeof milestones}`);
            return;
        }

        this.milestones = milestones.map(data => new Milestone(data));
    }

    clearMilestones() {
        this.elements.jMilestones.empty();
    }

    buildMilestones() {
        for (let i = 0; i < this.milestones.length; i++) {
            this.elements.jMilestones.append(this.milestones[i].build());
        }
    }

    fixMilestonePositions() {
        for (let i = 0; i < this.milestones.length; i++) {
            this.milestones[i].fixPositions();
        }
    }

    hideRoad() {
        this.elements.jRoad.css(toCSSProperties({bottom: -1000}));
    }

    showRoad() {
        this.elements.jRoad.css(toCSSProperties({bottom: 0}));
    }

    setData(data) {
        if (!data) return;

        if ('attackDuration' in data) {
            this.attackDuration = data['attackDuration'] || DEFAULT_ATTACK_DURATION;
        }

        if ('advancementPixelsPerSecond' in data) {
            this.advancementPixelsPerSecond = data['advancementPixelsPerSecond'] || DEFAULT_ADVANCEMENT_PIXELS_PER_SEC;
        }

        this.hideRoad();
        this.setCharacterImages(data['characters']);

        this.clearMilestones();
        this.setMilestoneData(data['milestones']);
        this.buildMilestones();
        setTimeout(() => {
            this.fixMilestonePositions();
            this.showRoad();
        }, 100);
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

    conquerMilestone(milestoneIndex, onDone) {
        if (!Number.isInteger(milestoneIndex)) {
            console.log(`milestoneIndex should be an integer. Got: ${milestoneIndex}`);
            return;
        } else if (milestoneIndex < 0 || milestoneIndex >= this.milestones.length) {
            console.log(
                `milestoneIndex is out of the range of [0, ${this.milestones.length - 1}]. Got: ${milestoneIndex}`
            );
            return;
        }

        let milestone = this.milestones[milestoneIndex];
        this.toAttacking();
        milestone.playEnemyDeath();
        setTimeout(() => {
            this.toIdle();
            milestone.removeEnemy();
            milestone.unlock();
            if (onDone) {
                onDone();
            }
        }, this.attackDuration);
    }

    setProgress(pixelProgress, sp) {
        pixelProgress = Math.min(pixelProgress, MAX_PROGRESS);
        this.elements.traveled.style.clipPath = `inset(0 ${1920 - pixelProgress}px 0 0)`;
        let centeredLeft = `${pixelProgress - 1920 / 2 - 11}px`;
        this.elements.progressPanel.style.left = centeredLeft;
        this.elements.progressSPContainer.style.left = centeredLeft;
        this.elements.progressSP.textContent = sp.toString();
        this.elements.characters.style.left = `${this.charactersInitialPosition.left + pixelProgress}px`;

        this.currentPixelProgress = pixelProgress;
        this.currentSP = sp;
    }

    animate(from, to, step, done, options) {
        options = options || {};
        if (step) {
            if (from === to) {
                options.step = (current) => step(current, 1);
            } else {
                options.step = (current) => step(current, (current - from) / (to - from));
            }
        }
        if (done) {
            options.done = done;
        }

        this.elements.jAnimator.css({left: from});
        this.elements.jAnimator.animate(
            {left: toPixels(to)},
            options,
        );
    }

    advance(targetPixelProgress, targetSP, onDone) {
        let startingSP = this.currentSP;
        let spDiff = targetSP - startingSP;
        this.toMoving();
        this.animate(
            this.currentPixelProgress,
            targetPixelProgress,
            (current, alpha) => this.setProgress(Math.round(current), Math.round(startingSP + alpha * spDiff)),
            () => {
                this.toIdle();
                if (onDone) {
                    onDone();
                }
            },
            {
                easing: "linear",
                duration: 1000 * (targetPixelProgress - this.currentPixelProgress) / this.advancementPixelsPerSecond,
            },
        );
    }

    pushEvent(event) {
        this.eventQueue.push(event);
        if (this.eventQueue.length === 1) {
            event.perform();
        }
    }

    pushAdvanceEvent(data) {
        if (!(data && 'targetPixelProgress' in data && 'targetSP' in data)) {
            console.log(`Bad advance event data received: ${data}`);
            return;
        }

        this.pushEvent(new AdvanceEvent(this, data['targetPixelProgress'], data['targetSP']));
    }

    pushConquerEvent(data) {
        if (!(data && 'milestoneIndex' in data)) {
            console.log(`Bad conquer event data received: ${data}`);
            return;
        }

        this.pushEvent(new ConquerEvent(this, data['milestoneIndex']));
    }

    eventFinished(event) {
        if (this.eventQueue.length > 0 && this.eventQueue[0] === event) {
            this.eventQueue.shift();

            if (this.eventQueue.length > 0) {
                this.eventQueue[0].perform();
            }
        }
    }

    start() {
        this.server.on('setPixelProgress', (data) => this.setProgress(data['pixelProgress'], data['sp']));
        this.server.on('setData', (data) => this.setData(data));
        this.server.on('advance', (data) => this.pushAdvanceEvent(data));
        this.server.on('conquer', (data) => this.pushConquerEvent(data));

        this.server.attach();
    }
}

const sr = new StreamRaiders();
sr.start();
window.sr = sr;
