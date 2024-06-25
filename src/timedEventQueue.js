const Timers = require("./timers");


class TimedEventQueue {
    constructor(expirationTime, checkInterval) {
        this.expirationTime = expirationTime;
        this.checkInterval = checkInterval;
        this.queue = [];
        this.thresholds = [];

        this.timer = Timers.repeating(() => this._expireOldEvents());
    }

    addThreshold(count, callback) {
        this.thresholds.push({
            count,
            callback,
        });
    }

    start() {
        this.timer.set(this.checkInterval);
    }

    end() {
        this.timer.clear();
        this.queue = [];
    }

    addEvent(event) {
        this.queue.push({
            time: Date.now(),
            event,
        });

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
            this.queue.shift();
        }
    }

    _activateHitThresholds() {
        for (let threshold of this.thresholds) {
            if (threshold.count === this.queue.length) {
                threshold.callback(this.queue.map(entry => entry.event));
            }
        }
    }
}

module.exports = TimedEventQueue;
