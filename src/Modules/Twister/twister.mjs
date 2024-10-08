import { ModuleClient } from "/common/moduleClient.mjs";

const WATCH_TEXT = "🌪️ TORNADO WATCH! 🌪️";
const WARNING_TEXT = "⚠️ TORNADO WARNING! ⚠️";

const TORNADO_WARNING_FLASHES = 5;
const FADE_DURATION = 500;

const BGM_SOUND_NAME = "bgm";
const WARNING_SOUND_NAME = "warning";
const DEFAULT_PRIZE_SCROLL_DELAY = 2;
const DEFAULT_SCROLL_SPEED = 50;


function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const secondsString = `${seconds < 10 ? "0" : ""}${seconds}`;
    return `${minutes}:${secondsString}`;
}


class Twister extends ModuleClient {
    constructor() {
        super('Twister');
        
        this.config = {
            prizeScrollDelay: DEFAULT_PRIZE_SCROLL_DELAY,
            prizeScrollSpeed: DEFAULT_SCROLL_SPEED,
        };

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
            jPrizeListContainer: $('#prize-list-container'),
            jPrizeList: $('#prize-list'),
            jScrollingAnimationKeyframes: $('#scrolling-animation-keyframes'),
        };

        window.addEventListener('message', (e) => this._onChildEventMessage(e), false);

        this.timerHandle = null;
        this.timeLeft = 0;

        this.delayedSkins = [];
        this.tornadoStartingLevel = 1;
        this.tornadoStartingTime = 0;
        this.delayedProgressData = null;
        this.prizeList = [];

        // This is true only when the tornado event is active (and isn't on its way out)
        this.active = false;

        // This is true when the tornado is visible on the screen (while active and while exiting, until the finale)
        this.visible = false;
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
        this._hideTornadoDetails();
        this.hidePrizes();
        this.show();
    }

    toWarn() {
        this.elements.jTitle.text(WARNING_TEXT);
        this.elements.jTitle.addClass("warn");
        this.elements.jTitle.removeClass("watch");
    }

    showWarn() {
        this.toWarn();
        this._hideTornadoDetails();
        this.hidePrizes();
        this.show();
    }

    startTornado(levelSettings) {
        this.prizeList = [];

        this.delayedProgressData = this.delayedProgressData || levelSettings.progress;
        this._playSoundIfExists(WARNING_SOUND_NAME);
        let jCombo = this.elements.jTitle;
        jCombo = jCombo.fadeOut(FADE_DURATION, () => this.toWarn());
        jCombo = jCombo.fadeIn(FADE_DURATION);
        for (let i = 0; i < TORNADO_WARNING_FLASHES - 1; i++) {
            jCombo = jCombo.fadeOut(FADE_DURATION);
            jCombo = jCombo.fadeIn(FADE_DURATION);
        }
        $.when(jCombo).then(() => this._activateTornado(this.tornadoStartingTime || levelSettings.duration));
        this.visible = true;
    }

    _playSoundIfExists(name) {
        if (this.sounds.hasSound(name)) {
            this.sounds.play(name);
        }
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
        this._playSoundIfExists(BGM_SOUND_NAME);
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
        const barWidth = this.elements.jProgressBar.outerWidth();
        const margin = (containerWidth - barWidth) / 2;
        const textWidth = this.elements.progressText.offsetWidth;
        let newRight = containerWidth * (1 - progress / 100) + 5; // 5px for margin
        newRight = Math.max(newRight, 5);
        newRight = Math.min(newRight, containerWidth - textWidth - margin - 10);
        this.elements.progressText.style.left = "";
        this.elements.progressText.style.right = `${newRight}px`; // Ensure it doesn't go out of bounds
    }

    setProgressPercentage(progress, allowOverflow) {
        progress = Math.max(0, progress);
        if (!allowOverflow) {
            progress = Math.min(progress, 100);
        }

        this.elements.progressText.textContent = `${Math.round(progress)}%`;
        this.setProgressDisplay(progress);
    }

    setProgressSP(current, total, allowOverflow) {
        current = Math.max(0, current);
        if (!allowOverflow) {
            current = Math.min(current, total);
        }

        this.elements.progressText.textContent = `${current} / ${total}`;
        this.setProgressDisplay(100 * current / total);
    }

    _setProgress(progressData) {
        if ("percentage" in progressData) {
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
        this.visible = false;
        this._showPrizesOnDisplay();
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

    _addPrizeEntry(htmlContent) {
        const entry = $('<div></div>')
            .addClass('entry')
            .html(htmlContent);

        this.elements.jPrizeList.append(entry);
    }

    _disableScrolling() {
        this.elements.jPrizeList.css('animation', 'none');
        this.elements.jScrollingAnimationKeyframes.empty();
    }

    _adjustScrollDuration() {
        const containerHeight = this.elements.jPrizeListContainer.height();
        let totalHeight = 0;
        $('.entry').each(function() {
            totalHeight += $(this).outerHeight();
        });

        const scrollHeight = totalHeight - containerHeight;

        if (scrollHeight > 0) {
            const scrollDuration = scrollHeight / this.config.prizeScrollSpeed; // Duration to scroll through all entries
            const totalDuration = 2 * (this.config.prizeScrollDelay + scrollDuration); // Total animation duration (pause at both ends)

            // Create dynamic keyframes for the scrolling animation
            const keyframes = `
              @keyframes scrollEntries {
                0% { top: 0; }
                ${((this.config.prizeScrollDelay / totalDuration) * 100).toFixed(2)}% { top: 0; }
                ${(((this.config.prizeScrollDelay + scrollDuration) / totalDuration) * 100).toFixed(2)}% { top: -${scrollHeight}px; }
                ${(((this.config.prizeScrollDelay + scrollDuration + this.config.prizeScrollDelay) / totalDuration) * 100).toFixed(2)}% { top: -${scrollHeight}px; }
                100% { top: 0; }
              }
            `;

            // Apply the dynamic keyframes to the style tag
            this.elements.jScrollingAnimationKeyframes.text(keyframes);
            this.elements.jPrizeList.css('animation', `scrollEntries ${totalDuration}s linear infinite`);
        } else {
            this._disableScrolling();
        }
    }

    _clearPrizeDisplay() {
        this._disableScrolling();
        this.elements.jPrizeList.empty();
    }

    _showPrizesOnDisplay() {
        if (this.prizeList.length === 0) return;

        this._clearPrizeDisplay();
        for (let prize of this.prizeList) {
            this._addPrizeEntry(prize);
        }

        this._adjustScrollDuration();
        this.elements.jPrizeListContainer.fadeIn(FADE_DURATION, () => this._adjustScrollDuration());
    }

    showPrizes(prizeList) {
        this.prizeList = prizeList;
        if (!this.visible) {
            this._showPrizesOnDisplay();
        }
    }

    hidePrizes() {
        this.elements.jPrizeListContainer.fadeOut(FADE_DURATION);
    }

    show() {
        this.elements.jMain.fadeIn(FADE_DURATION);
    }

    hide() {
        this.elements.jMain.fadeOut(FADE_DURATION, () => {
            this._hideTornadoDetails();
            this.elements.jPrizeListContainer.hide();
        });
    }

    _setupSound(name, data, loop) {
        if (this.sounds.hasSound(name)) {
            this.sounds.unloadSound(name);
        }

        if (data) {
            this.sounds.loadSounds({
                [name]: {
                    location: data.url,
                    loop,
                },
            });

            this.sounds.getSound(name).volumeFactor = data.volume / 100;
        }
    }

    setup(setupData) {
        this.config.prizeScrollDelay = setupData.prizeScrollDelay || this.config.prizeScrollDelay;
        this.config.prizeScrollSpeed = setupData.prizeScrollSpeed || this.config.prizeScrollSpeed;

        this._setupSound(BGM_SOUND_NAME, setupData.bgm, true);
        this._setupSound(WARNING_SOUND_NAME, setupData.warningSound, false);

        if (setupData.state === "Watch") {
            this.showWatch();
        } else if (setupData.state === "Active") {
            this.delayedSkins = setupData.skins || [];
            this.delayedProgressData = setupData.progress;
            this.tornadoStartingLevel = setupData.level + 1;
            this.showWarn();
            this.visible = true;
            setTimeout(() => this._activateTornado(setupData.remainingTime), 500);
        }
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
        this.server.on('setup', (setupData) => this.setup(setupData));
        this.server.on('showPrizes', (prizeList) => this.showPrizes(prizeList));
        this.server.on('hidePrizes', () => this.hidePrizes());
        this.server.on('setTimer', (duration) => this.setTimer(duration));
        this.server.attach();
    }
}

const t = new Twister();
t.start();
window.t = t;

// setTimeout(() => {
//     const prizes = [
//         `<span class="username">Bloop!</span> This is a <span class="prize-nice">nice</span> prize.`,
//         `<span class="username">Bloop!</span> This is a <span class="prize-good">good</span> prize.`,
//         `<span class="username">Bloop!</span> This is a <span class="prize-great">great</span> prize!`,
//         `<span class="username">Bloop!</span> This is an <span class="prize-amazing">AMAZING</span> prize!`,
//         `<span class="username">Bloop!</span> This is an <span class="prize-omg">OMG I CAN'T BELIEVE I GOT THIS</span> prize!!! =O`
//     ];
//
//     t.showWarn();
//     t._showTornadoDetails();
//     t.showPrizes(prizes);
// }, 500);

// setTimeout(() => {
//     t.showWarn();
//     t._showTornadoDetails();
//     t._setLevel(5);
//     t.elements.jTimer.text("1:23");
// }, 500);
//
// setTimeout(() => {
//     t.showWarn();
//     t._showTornadoDetails();
//     t.setProgressSP(10, 25);
// }, 500);
//
// window.s = (sp) => t.setProgressSP(sp, 25, true);
