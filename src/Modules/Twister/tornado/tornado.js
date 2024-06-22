
class Tornado {
    constructor() {
        this.bottom = 0;
        this.height = height;
        this.noiseGen = new NoiseGenerator();
        this.elevator = new Elevator(-this.height, this.bottom);
        this.distancer = new Distancer(this.bottom, this.bottom + this.height, 10, 400);
        this.positioner = new Positioner(this.noiseGen, this.elevator);
        this.spinner = new Spinner();
        this.rotator = new Rotator(this.noiseGen);
    }

    updateDebrisTransform(debris) {
        debris.angle = this.spinner.spin(debris.angle, debris.spinDirection, debris.angularSpeedFactor);
        debris.distance = this.distancer.distanceFromElevation(-debris.position.y)
        debris.position = this.positioner.getPositionAroundCenter(
            debris.center,
            debris.distance,
            debris.angle,
            debris.position.y,
            debris.index,
        );

        debris.rotation = this.rotator.rotate(debris.rotation, debris.index);
    }

    tick() {
        this.noiseGen.increment();
    }
}
