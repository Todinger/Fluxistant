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

    addThreshold(count, callback) {
        this.thresholds.push({
            count,
            callback,
            cleared: false,
        });
    }

    clearThresholds() {
        this.thresholds = [];
    }

    start() {
        if (this.checkInterval === 0) return;

        this.timer.set(this.checkInterval);
    }

    end() {
        this.timer.clear();
        this.queue = [];
        this.totalValue = 0;
        for (let threshold of this.thresholds) {
            threshold.cleared = false;
        }
    }

    addEvent(event, value = 1) {
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
                threshold.callback();
            }
        }
    }
}

module.exports = TimedEventQueue;
