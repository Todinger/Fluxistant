
class Tornado {
    constructor() {
        this.bottom = 0;
        this.height = height;
        this.center = createVector(0, -height / 2, 0);
        this.noiseGen = new NoiseGenerator();
        this.elevator = new Elevator(-this.height, this.bottom);
        this.distancer = new Distancer(this.bottom, this.bottom + this.height, 10, 400);
        this.positioner = new Positioner(this.noiseGen, this.elevator);
        this.spinner = new Spinner();
        this.rotator = new Rotator(this.noiseGen);

        this.spawnRange = {
            minSpeed: 0.01,
            maxSpeed: 0.01,
            minAngle: -3 * PI / 4,
            maxAngle: PI / 2,
            outerDistance: 100,
        };

        this.debris = [];
        this.pendingDebris = [];

        this.currentTick = 0;
    }

    makeInitialDebrisPosition(debris) {
        let elevation = random(-20 + this.bottom, -this.height * 0.8 + this.bottom);
        let distance = this.distancer.distanceFromElevation(-elevation)
        return this.positioner.getPositionAroundCenter(
            this.center,
            distance,
            debris.angle,
            elevation,
            this.debris.length,
        );
    }

    makeFutureInitialDebrisPosition(debris, ticksAhead) {
        this.noiseGen.fastForward(ticksAhead);
        let position = this.makeInitialDebrisPosition(debris);
        this.noiseGen.rewind(ticksAhead);
        return position;
    }

    // Gets position of debris using noise from `ticksAhead` ticks ahead, assuming
    // the debris would have the data it currently does - i.e. this does not calculate
    // all ticks between now and then, but rather "starts time" at the future tick
    getFutureDebrisPosition(debris, startingPosition, index, ticksAhead) {
        this.noiseGen.fastForward(ticksAhead);

        let angle = this.spinner.spin(debris.angle, debris.spinDirection, debris.angularSpeedFactor);
        let distance = this.distancer.distanceFromElevation(-startingPosition.y)
        let position = this.positioner.getPositionAroundCenter(
            this.center,
            distance,
            angle,
            startingPosition.y,
            index,
        );

        this.noiseGen.rewind(ticksAhead);

        return position;
    }

    addDebris(debris) {
        debris.position = this.makeInitialDebrisPosition(debris);
        this.debris.push(debris);
    }

    _getSpawnPointParameterForX(initialPoint, movementDirection, spawnX) {
        if (movementDirection.x === 0) {
            // No movement on the X axis means it can't reach spawn points to the right/left of the screen
            return 0;
        }

        return (initialPoint.x - spawnX) / movementDirection.x;
    }

    _getSpawnPointParameterForZ(initialPoint, movementDirection, spawnZ) {
        if (movementDirection.z === 0) {
            // No movement on the Z axis means it can't reach spawn points behind the camera
            return 0;
        }

        return (initialPoint.z - spawnZ) / movementDirection.z;
    }

    _addPendingDebris(debris) {
        let speed = random(this.spawnRange.minSpeed, this.spawnRange.maxSpeed);
        let pendingDurationInTicks = Math.ceil(1 / speed);
        debris.angle = constrain(debris.angle, this.spawnRange.minAngle, this.spawnRange.maxAngle);
        let initialDebrisTornadoPosition = this.makeFutureInitialDebrisPosition(debris, pendingDurationInTicks - 1);
        let index = this.debris.length;
        let nextDebrisPositionAfterArrival = this.getFutureDebrisPosition(debris, initialDebrisTornadoPosition, index, pendingDurationInTicks);
        let movementDirection = p5.Vector.sub(nextDebrisPositionAfterArrival, initialDebrisTornadoPosition);

        let spawnPoint;
        let t = 0;
        let testedSpawnPointParameter;
        let p = initialDebrisTornadoPosition;
        let d = movementDirection;

        testedSpawnPointParameter = this._getSpawnPointParameterForX(p, d, -width / 2 - this.spawnRange.outerDistance);
        if (testedSpawnPointParameter > 0 && (t === 0 || testedSpawnPointParameter < t)) {
            t = testedSpawnPointParameter;
        }
        testedSpawnPointParameter = this._getSpawnPointParameterForX(p, d, width / 2 + this.spawnRange.outerDistance);
        if (testedSpawnPointParameter > 0 && (t === 0 || testedSpawnPointParameter < t)) {
            t = testedSpawnPointParameter;
        }
        testedSpawnPointParameter = this._getSpawnPointParameterForZ(p, d, mainCamera.eyeZ + this.spawnRange.outerDistance);
        if (testedSpawnPointParameter > 0 && (t === 0 || testedSpawnPointParameter < t)) {
            t = testedSpawnPointParameter;
        }

        if (t > 0) {
            spawnPoint = p5.Vector.sub(p, p5.Vector.mult(d, t));
        } else {
            spawnPoint = createVector(0, 0, mainCamera.eyeZ + this.spawnRange.outerDistance);
        }

        debris.position = spawnPoint;
        let entranceVector = p5.Vector.sub(initialDebrisTornadoPosition, spawnPoint);
        let stepVector = p5.Vector.mult(entranceVector, speed);
        let pendingDebrisData = {
            debris,
            index,
            speed,
            alpha: 0,
            step: stepVector,
            targetPoint: initialDebrisTornadoPosition,
        };

        this.pendingDebris.push(pendingDebrisData);
        this.debris.push(null);
    }

    throwIn(debris) {
        this._addPendingDebris(debris);
    }

    updateDebrisTransform(index) {
        const debris = this.debris[index];
        if (debris === null) return;
        debris.angle = this.spinner.spin(debris.angle, debris.spinDirection, debris.angularSpeedFactor);
        debris.distance = this.distancer.distanceFromElevation(-debris.position.y)
        debris.position = this.positioner.getPositionAroundCenter(
            this.center,
            debris.distance,
            debris.angle,
            debris.position.y,
            index,
        );

        debris.rotation = this.rotator.rotate(debris.rotation, index);
    }

    updatePendingDebrisTransform(pendingDebrisData) {
        let alpha = min(1, pendingDebrisData.alpha + pendingDebrisData.speed);
        if (alpha === 1) {
            pendingDebrisData.debris.position = pendingDebrisData.targetPoint;
            this.debris[pendingDebrisData.index] = pendingDebrisData.debris;
            return true;
        } else {
            pendingDebrisData.debris.position.add(pendingDebrisData.step);
            pendingDebrisData.alpha = alpha;
            return false;
        }
    }

    update() {
        for (let i = 0; i < this.debris.length; i++) {
            this.updateDebrisTransform(i);
        }

        let pendingIndicesToRemove = [];
        for (let i = 0; i < this.pendingDebris.length; i++) {
            if (this.updatePendingDebrisTransform(this.pendingDebris[i])) {
                pendingIndicesToRemove.unshift(i);
            }
        }

        for (let index of pendingIndicesToRemove) {
            this.pendingDebris.splice(index, 1);
        }
    }

    show() {
        for (let debris of this.debris) {
            if (debris !== null) {
                debris.show();
            }
        }

        for (let pendingDebrisData of this.pendingDebris) {
            pendingDebrisData.debris.show();
        }
    }

    tick() {
        this.update();
        this.show();
        this.noiseGen.increment();
        this.currentTick++;
    }
}
