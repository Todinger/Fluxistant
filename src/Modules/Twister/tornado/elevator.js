
class Elevator {
    constructor(minElevation, maxElevation) {
        this.setLimits(minElevation, maxElevation);
    }

    setLimits(minElevation, maxElevation) {
        this.minElevation = minElevation;
        this.maxElevation = maxElevation;
    }

    _getProbabilityForHeadingBackForcefully(centerElevation, currentElevation) {
        currentElevation = constrain(currentElevation, this.minElevation, this.maxElevation);
        centerElevation = constrain(centerElevation, this.minElevation, this.maxElevation);
        if (currentElevation === centerElevation) {
            return 0;
        } else if (currentElevation < centerElevation) {
            return map(currentElevation, this.minElevation, centerElevation, 1, 0);
        } else {
            return map(currentElevation, this.maxElevation, centerElevation, 1, 0);
        }
    }

    getElevationDirectionOverride(center, currentElevation) {
        if (currentElevation === center.y) {
            return 0;
        }

        let p = this._getProbabilityForHeadingBackForcefully(center.y, currentElevation);
        let directionTowardsCenter = Math.sign(center.y - currentElevation);
        const r = random();
        if (r < p) {
            // console.log(`p = ${p}, dir = ${directionTowardsCenter}`);
            return directionTowardsCenter;
        } else {
            // console.log(`p = ${p}, dir = 0`);
            return 0;
        }
    }
}
