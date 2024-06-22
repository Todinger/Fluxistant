const DEFAULT_INCREMENT_X = 0.01;
const DEFAULT_INCREMENT_Y = 0;

class NoiseGenerator {
    constructor() {
        this.simplex = new OpenSimplexNoise(Date.now());
        this.xoff = 0;
        this.yoff = 0;
    }

    noiseByArea(xArea, yArea) {
        return this.simplex.noise2D(xArea + this.xoff, yArea);
    }

    increment(xoff = DEFAULT_INCREMENT_X, yoff = DEFAULT_INCREMENT_Y) {
        this.xoff += xoff;
        this.yoff += yoff;
    }
}
