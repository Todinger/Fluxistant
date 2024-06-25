import { ModuleClient } from "/common/moduleClient.mjs";

const WATCH_TEXT = "🌪️ TORNADO WATCH! 🌪️";
const WARNING_TEXT = "⚠️ TORNADO WARNING! ⚠️";

const TORNADO_WARNING_FLASHES = 5;
const FADE_DURATION = 500;


class Twister extends ModuleClient {
    constructor() {
        super('Twister');

        this.currentLevel = 1;

        this.elements = {
            jMain: $("#main"),
            iframe: document.getElementById('frame'),
            level: document.getElementById('level'),
            timer: document.getElementById('timer'),
            title: document.getElementById('title'),
            jTitle: $('#title'),
            progressBar: document.getElementById('progress-bar'),
            progressText: document.getElementById('progress-text'),
            progressContainer: document.getElementById('progress-container'),
        };

        window.addEventListener('message', (e) => this._onChildEventMessage(e), false);
    }

    sendToChild(eventName, arg) {
        this.elements.iframe.contentWindow.postMessage([eventName, arg], "*");
    }

    toWatch() {
        this.elements.title.textContent = WATCH_TEXT;
        this.elements.title.classList.add("watch");
        this.elements.title.classList.remove("warn");
    }

    showWatch() {
        this.toWatch();
        this.show();
    }

    toWarn() {
        this.elements.title.textContent = WARNING_TEXT;
        this.elements.title.classList.add("warn");
        this.elements.title.classList.remove("watch");
    }

    showWarn() {
        this.toWarn();
        this.show();
    }

    startTornado() {
        let jCombo = this.elements.jTitle;
        jCombo = jCombo.fadeOut(FADE_DURATION, () => this.toWarn());
        jCombo = jCombo.fadeIn(FADE_DURATION);
        for (let i = 0; i < TORNADO_WARNING_FLASHES - 1; i++) {
            jCombo = jCombo.fadeOut(FADE_DURATION);
            jCombo = jCombo.fadeIn(FADE_DURATION);
        }
        $.when(jCombo).then(() => this.sendToChild("start"));
    }

    throwIn(skinName) {
        this.sendToChild("throwIn", skinName);
    }

    setProgress(progress) {
        progress = Math.max(0, Math.min(progress, 100));
        this.elements.progressBar.style.clipPath = `inset(0% ${progress < 100 ? 100 - progress : -1}% 0% 0%)`;

        // Adjust the position of the progress text
        const containerWidth = this.elements.progressContainer.offsetWidth;
        const newRight = containerWidth * (1 - progress / 100) + 5; // 5px for margin
        this.elements.progressText.style.left = "";
        this.elements.progressText.style.right = `${Math.max(newRight, 5)}px`; // Ensure it doesn't go out of bounds

        this.elements.progressText.textContent = `${progress}%`;
    }

    grow() {
        this.sendToChild("grow");
        this.elements.level.classList.remove(`ef${this.currentLevel}`);
        this.elements.timer.classList.remove(`timer-ef${this.currentLevel}`);
        this.currentLevel = Math.min(this.currentLevel + 1, 5);
        this.elements.level.classList.add(`ef${this.currentLevel}`);
        this.elements.timer.classList.add(`timer-ef${this.currentLevel}`);
        this.elements.level.textContent = `EF${this.currentLevel}`;
    }

    endTornado() {
        this.sendToChild("end");
    }

    _onChildEventMessage(e) {
        let event = e.data[0];
        if (event !== "finaleDone") return;

        this._onTornadoFinaleDone();
    }

    _onTornadoFinaleDone() {
        this.hide(() => this.toWatch());
    }

    show() {
        this.elements.jMain.fadeIn(FADE_DURATION);
    }

    hide(onDone) {
        this.elements.jMain.fadeOut(FADE_DURATION, onDone);
    }

    start() {
        this.server.on('watch', () => this.showWatch());
        this.server.on('warn', () => this.showWarn());
        this.server.on('startTornado', () => this.startTornado());
        this.server.on('throwIn', (skinName) => this.throwIn(skinName));
        this.server.on('grow', () => this.grow());
        this.server.on('endTornado', () => this.endTornado());
        this.server.on('show', () => this.show());
        this.server.on('hide', () => this.hide());
        this.server.attach();
    }
}

const t = new Twister();
t.start();
window.t = t;
