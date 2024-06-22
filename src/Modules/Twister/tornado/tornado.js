
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

        this.debris = [];
    }

    addDebris(debris) {
        let elevation = random(-20 + this.bottom, -this.height * 0.8 + this.bottom);
        debris.position = this.positioner.getPositionAroundCenter(
            debris.center,
            debris.distance,
            debris.angle,
            elevation,
            this.debris.length,
        );

        this.debris.push(debris);
    }

    updateDebrisTransform(index) {
        const debris = this.debris[index];
        debris.angle = this.spinner.spin(debris.angle, debris.spinDirection, debris.angularSpeedFactor);
        debris.distance = this.distancer.distanceFromElevation(-debris.position.y)
        debris.position = this.positioner.getPositionAroundCenter(
            debris.center,
            debris.distance,
            debris.angle,
            debris.position.y,
            index,
        );

        debris.rotation = this.rotator.rotate(debris.rotation, index);
    }

    update() {
        for (let i = 0; i < this.debris.length; i++) {
            this.updateDebrisTransform(i);
        }
    }

    show() {
        for (let debris of this.debris) {
            debris.show();
        }
    }

    tick() {
        this.update();
        this.show();
        this.noiseGen.increment();
    }
}
