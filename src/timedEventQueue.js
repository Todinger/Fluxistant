const Timers = require("./timers");


class TimedEventQueue {
    constructor(expirationTime, checkInterval) {
        this.expirationTime = expirationTime;
        this.checkInterval = checkInterval;
        this.queue = [];
        this.thresholds = [];

        this.timer = Timers.repeating(() => this._expireOldEvents());

        this.totalValue = 0;

        this.valueCounter = null;
        this.active = false;
        this.paused = false;
    }

    get events() {
        return this.queue.map(entry => entry.event);
    }

    setValueCounter(counterFunction) {
        this.valueCounter = counterFunction;
    }

    clearValueCounter() {
        this.valueCounter = null;
    }

    addThreshold(count, callback, declinationCallback) {
        this.thresholds.push({
            count,
            callback,
            declinationCallback,
            cleared: false,
        });
    }

    clearThresholds() {
        this.thresholds = [];
    }

    start() {
        if (this.checkInterval === 0) return;

        this.timer.set(this.checkInterval);
        this.active = true;
        this.paused = false;
    }

    pauseClearing() {
        this.paused = true;
        this.timer.clear();
    }

    end() {
        this.active = false;
        this.paused = false;
        this.timer.clear();
        this.queue = [];
        this.totalValue = 0;
        for (let threshold of this.thresholds) {
            threshold.cleared = false;
        }
    }

    addEvent(event, value = 1) {
        if (!this.active) return;

        this.queue.push({
            time: Date.now(),
            event,
            value,
        });

        this.totalValue += value;

        this._activateHitThresholds();
    }

    _expireOldEvents() {
        let itemsToDelete = 0;
        for (let entry of this.queue) {
            if (Date.now() - entry.time < this.expirationTime) {
                break;
            }

            itemsToDelete++;
        }

        for (let i = 0; i < itemsToDelete; i++) {
            this.totalValue -= this.queue[0].value;
            this.queue.shift();
        }

        this._declineThresholds();
    }

    _activateHitThresholds() {
        let totalValue;
        if (this.valueCounter) {
            totalValue = this.valueCounter(this.events);
        } else {
            totalValue = this.totalValue;
        }

        for (let threshold of this.thresholds) {
            if (totalValue >= threshold.count && !threshold.cleared) {
                threshold.cleared = true;
                if (threshold.callback) {
                    threshold.callback();
                }
            }
        }
    }

    _declineThresholds() {
        let totalValue;
        if (this.valueCounter) {
            totalValue = this.valueCounter(this.events);
        } else {
            totalValue = this.totalValue;
        }

        for (let threshold of [...this.thresholds].reverse()) {
            if (totalValue < threshold.count && threshold.cleared) {
                threshold.cleared = false;
                if (threshold.declinationCallback) {
                    threshold.declinationCallback();
                }
            }
        }
    }
}

module.exports = TimedEventQueue;
