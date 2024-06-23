
class Distancer {
    constructor(minElevation, maxElevation, minDistance, maxDistance) {
        this.setLimits(minElevation, maxElevation, minDistance, maxDistance);
    }

    setLimits(minElevation, maxElevation, minDistance, maxDistance) {
        this.minElevation = minElevation;
        this.maxElevation = maxElevation;
        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
    }

    distanceFromElevation(elevation) {
        elevation = constrain(elevation, this.minElevation, this.maxElevation);
        return map(elevation, this.minElevation, this.maxElevation, this.minDistance, this.maxDistance);
    }
}
