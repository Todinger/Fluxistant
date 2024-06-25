import { ModuleClient } from "/common/moduleClient.mjs";

const WATCH_TEXT = "🌪️ TORNADO WATCH! 🌪️";
const WARNING_TEXT = "⚠️ TORNADO WARNING! ⚠️";

const TORNADO_WARNING_FLASHES = 5;
const FADE_DURATION = 500;


function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const secondsString = `${seconds < 10 ? "0" : ""}${seconds}`;
    return `${minutes}:${secondsString}`;
}


class Twister extends ModuleClient {
    constructor() {
        super('Twister');

        this.currentLevel = 1;

        this.elements = {
            jMain: $("#main"),
            iframe: document.getElementById('frame'),
            jLevel: $('#level'),
            jTimer: $('#timer'),
            jTitle: $('#title'),
            progressBar: document.getElementById('progress-bar'),
            progressText: document.getElementById('progress-text'),
            progressContainer: document.getElementById('progress-container'),
        };

        window.addEventListener('message', (e) => this._onChildEventMessage(e), false);

        this.timerHandle = null;
        this.timeLeft = 0;
    }

    sendToChild(eventName, arg) {
        this.elements.iframe.contentWindow.postMessage([eventName, arg], "*");
    }

    toWatch() {
        this.elements.jTitle.text(WATCH_TEXT);
        this.elements.jTitle.addClass("watch");
        this.elements.jTitle.removeClass("warn");
    }

    showWatch() {
        this.toWatch();
        this.show();
    }

    toWarn() {
        this.elements.jTitle.text(WARNING_TEXT);
        this.elements.jTitle.addClass("warn");
        this.elements.jTitle.removeClass("watch");
    }

    showWarn() {
        this.toWarn();
        this.show();
    }

    startTornado(duration) {
        let jCombo = this.elements.jTitle;
        jCombo = jCombo.fadeOut(FADE_DURATION, () => this.toWarn());
        jCombo = jCombo.fadeIn(FADE_DURATION);
        for (let i = 0; i < TORNADO_WARNING_FLASHES - 1; i++) {
            jCombo = jCombo.fadeOut(FADE_DURATION);
            jCombo = jCombo.fadeIn(FADE_DURATION);
        }
        $.when(jCombo).then(() => this._activateTornado(duration));
    }

    _activateTornado(duration) {
        this.setTimer(duration);
        this.sendToChild("start");
    }

    throwIn(skinName) {
        this.sendToChild("throwIn", skinName);
    }

    setProgressDisplay(progress) {
        progress = Math.max(0, Math.min(progress, 100));
        this.elements.progressBar.style.clipPath = `inset(0% ${progress < 100 ? 100 - progress : -1}% 0% 0%)`;

        // Adjust the position of the progress text
        const containerWidth = this.elements.progressContainer.offsetWidth;
        const newRight = containerWidth * (1 - progress / 100) + 5; // 5px for margin
        this.elements.progressText.style.left = "";
        this.elements.progressText.style.right = `${Math.max(newRight, 5)}px`; // Ensure it doesn't go out of bounds
    }

    setProgressPercentage(progress) {
        this.setProgressDisplay(progress);
        this.elements.progressText.textContent = `${progress}%`;
    }

    setProgressSP(current, total) {
        current = Math.min(current, total);
        this.setProgressDisplay(100 * current / total);
        this.elements.progressText.textContent = `${current} / ${total}`;
    }

    setProgress(progressData) {
        if (progressData["percentage"]) {
            this.setProgressPercentage(progressData["percentage"]);
        } else {
            this.setProgressSP(progressData["currentSP"], progressData["maxSP"]);
        }
    }

    grow(newDuration) {
        this.sendToChild("grow");
        this.elements.jLevel.removeClass(`ef${this.currentLevel}`);
        this.elements.jTimer.removeClass(`timer-ef${this.currentLevel}`);
        this.currentLevel = Math.min(this.currentLevel + 1, 5);
        this.elements.jLevel.addClass(`ef${this.currentLevel}`);
        this.elements.jTimer.addClass(`timer-ef${this.currentLevel}`);
        this.elements.jLevel.text(`EF${this.currentLevel}`);

        this.setTimer(newDuration);
    }

    endTornado() {
        this.sendToChild("end");
    }

    setTimer(time) {
        this.timeLeft = time;
        this._updateTimeText();
        if (this.timerHandle !== null) {
            clearInterval(this.timerHandle);
        }

        this.timerHandle = setInterval(() => this._timerTick(), 1000);
    }

    _timerTick() {
        this.timeLeft = Math.max(0, this.timeLeft - 1);
        this._updateTimeText();
    }

    _updateTimeText() {
        this.elements.jTimer.text(formatTime(this.timeLeft));
    }

    _onChildEventMessage(e) {
        let event = e.data[0];
        if (event !== "finaleDone") return;

        this._onTornadoFinaleDone();
    }

    _onTornadoFinaleDone() {
        this.hide(() => this._clearState());
    }

    _clearState() {
        this.toWatch();
        this.elements.jTimer.text("");
        if (this.timerHandle !== null) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
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
        this.server.on('startTornado', (duration) => this.startTornado(duration));
        this.server.on('throwIn', (skinName) => this.throwIn(skinName));
        this.server.on('setProgress', (progressData) => this.setProgress(progressData));
        this.server.on('grow', (newDuration) => this.grow(newDuration));
        this.server.on('endTornado', () => this.endTornado());
        this.server.on('show', () => this.show());
        this.server.on('hide', () => this.hide());
        this.server.attach();
    }
}

const t = new Twister();
t.start();
window.t = t;
