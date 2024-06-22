const DEFAULT_INCREMENT = 0.1;


class Spinner {
    constructor() {
        this.increment = DEFAULT_INCREMENT;
    }

    spin(angle, direction) {
        return angle + direction * this.increment;
    }
}

