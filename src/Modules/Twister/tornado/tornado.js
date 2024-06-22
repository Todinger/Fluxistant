
class Tornado {
    constructor() {
        this.bottom = 0;
        this.height = height;
        this.noiseGen = new NoiseGenerator();
        this.elevator = new Elevator(-this.height, this.bottom);
        this.positioner = new Positioner(this.noiseGen, this.elevator);
        this.spinner = new Spinner();
    }

    tick() {
        this.noiseGen.increment();
    }
}
