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
            jProgressBar: $('#progress-bar'),
            progressText: document.getElementById('progress-text'),
            jProgressContainer: $('#progress-container'),
        };

        window.addEventListener('message', (e) => this._onChildEventMessage(e), false);

        this.timerHandle = null;
        this.timeLeft = 0;

        this.delayedSkins = [];
        this.tornadoStartingLevel = 1;
        this.tornadoStartingTime = 0;
        this.delayedProgressData = null;

        this.sounds.loadSounds({
            bgm: {
                location: 'audio/bgm.mp3',
                loop: true,
            },
        });

        // This is true only when the tornado event is active (and isn't on its way out)
        this.active = false;
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

    startTornado(levelSettings) {
        this.delayedProgressData = this.delayedProgressData || levelSettings.progress;
        let jCombo = this.elements.jTitle;
        jCombo = jCombo.fadeOut(FADE_DURATION, () => this.toWarn());
        jCombo = jCombo.fadeIn(FADE_DURATION);
        for (let i = 0; i < TORNADO_WARNING_FLASHES - 1; i++) {
            jCombo = jCombo.fadeOut(FADE_DURATION);
            jCombo = jCombo.fadeIn(FADE_DURATION);
        }
        $.when(jCombo).then(() => this._activateTornado(this.tornadoStartingTime || levelSettings.duration));
    }

    _activateTornado(duration) {
        this.setTimer(duration);
        this.sendToChild("start", this.tornadoStartingLevel - 1);
        this._setProgress(this.delayedProgressData);
        this._showTornadoDetails();
        this._addIn(this.delayedSkins);
        this.delayedSkins = [];
        this.active = true;
        this._setLevel(this.tornadoStartingLevel);
        this.sounds.play("bgm");
    }

    _addIn(skinNames) {
        for (let skinName of skinNames) {
            this.sendToChild("addIn", skinName);
        }
    }

    _throwIn(skinNames) {
        for (let skinName of skinNames) {
            this.sendToChild("throwIn", skinName);
        }
    }

    requestThrowIn(skinNames) {
        if (this.active) {
            this._throwIn(skinNames);
        } else {
            this.delayedSkins.push(...skinNames);
        }
    }

    setProgressDisplay(progress) {
        this.elements.jProgressBar.css({clipPath: `inset(0% ${progress < 100 ? 100 - progress : -1}% 0% 0%)`});

        // Adjust the position of the progress text
        const containerWidth = this.elements.jProgressContainer.outerWidth();
        const newRight = containerWidth * (1 - progress / 100) + 5; // 5px for margin
        this.elements.progressText.style.left = "";
        this.elements.progressText.style.right = `${Math.max(newRight, 5)}px`; // Ensure it doesn't go out of bounds
    }

    setProgressPercentage(progress, allowOverflow) {
        progress = Math.max(0, progress);
        if (!allowOverflow) {
            progress = Math.min(progress, 100);
        }

        this.setProgressDisplay(progress);
        this.elements.progressText.textContent = `${progress}%`;
    }

    setProgressSP(current, total, allowOverflow) {
        current = Math.max(0, current);
        if (!allowOverflow) {
            current = Math.min(current, total);
        }

        this.setProgressDisplay(100 * current / total);
        this.elements.progressText.textContent = `${current} / ${total}`;
    }

    _setProgress(progressData) {
        if (progressData["percentage"]) {
            this.setProgressPercentage(progressData["percentage"], progressData["allowOverflow"]);
        } else {
            this.setProgressSP(progressData["currentSP"], progressData["maxSP"], progressData["allowOverflow"]);
        }
    }

    _setLevel(level) {
        this.elements.jLevel.removeClass(`ef${this.currentLevel}`);
        this.elements.jTimer.removeClass(`timer-ef${this.currentLevel}`);
        this.currentLevel = Math.min(level, 5);
        this.elements.jLevel.addClass(`ef${this.currentLevel}`);
        this.elements.jTimer.addClass(`timer-ef${this.currentLevel}`);
        this.elements.jLevel.text(`EF${this.currentLevel}`);
    }

    _grow(newDuration) {
        this.sendToChild("grow");
        this._setLevel(this.currentLevel + 1);

        if (newDuration) {
            this.setTimer(newDuration);
        }
    }

    requestGrow(growthDetails) {
        if (this.active) {
            for (let i = 0; i < growthDetails.levels - 1; i++) {
                this._grow();
            }

            this._grow(growthDetails.duration);
            this._setProgress(growthDetails.progress);
        } else {
            this.tornadoStartingLevel += growthDetails.levels;
            this.tornadoStartingTime = growthDetails.duration;
            this.delayedProgressData = growthDetails.progress;
        }
    }

    requestProgress(progressData) {
        if (this.active) {
            this._setProgress(progressData);
        } else {
            this.delayedProgressData = progressData;
        }
    }

    endTornado() {
        this.sendToChild("end");
        this.delayedSkins = [];
        this.tornadoStartingLevel = 1;
        this.tornadoStartingTime = 0;
        this.active = false;
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
        this.sounds.fadeOutAndStop(FADE_DURATION);
        this.hide(() => this._clearState());
    }

    _showTornadoDetails() {
        this.elements.jLevel.show();
        this.elements.jTimer.show();
        this.elements.jProgressContainer.show();
    }

    _hideTornadoDetails() {
        this.elements.jLevel.hide();
        this.elements.jTimer.hide();
        this.elements.jProgressContainer.hide();
    }

    _clearState() {
        this._hideTornadoDetails();
        this.toWatch();
        this.elements.jTimer.text("");
        if (this.timerHandle !== null) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }

        this._setLevel(1);
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
        this.server.on('startTornado', (levelSettings) => this.startTornado(levelSettings));
        this.server.on('throwIn', (skinNames) => this.requestThrowIn(skinNames));
        this.server.on('setProgress', (progressData) => this.requestProgress(progressData));
        this.server.on('grow', (growthDetails) => this.requestGrow(growthDetails));
        this.server.on('endTornado', () => this.active && this.endTornado());
        this.server.on('show', () => this.show());
        this.server.on('hide', () => this.hide());
        this.server.attach();
    }
}

const t = new Twister();
t.start();
window.t = t;
