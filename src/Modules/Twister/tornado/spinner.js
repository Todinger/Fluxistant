const DEFAULT_INCREMENT = 0.05;


class Spinner {
    constructor() {
        this.increment = DEFAULT_INCREMENT;
    }

    spin(angle, direction, angularSpeedFactor) {
        return angle + direction * this.increment * angularSpeedFactor;
    }
}
