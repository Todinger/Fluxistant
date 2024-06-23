
const DEFAULT_NOISE_SCALE = {
    x: 10,
    y: 3,
    z: 10,
};

const DEFAULT_AXIS_REGIONS = {
    x: 0,
    y: 1000,
    z: 2000,
};

const DEFAULT_INDEX_REGION_SEPARATION = 1000;

class Positioner {
    constructor(noiseGen, elevator) {
        this.noiseGen = noiseGen;
        this.elevator = elevator;
        this.noiseScale = DEFAULT_NOISE_SCALE;
        this.axisRegions = DEFAULT_AXIS_REGIONS;
        this.indexRegionSeparation = DEFAULT_INDEX_REGION_SEPARATION;
    }

    getPositionAroundCenter(center, radius, angle, elevation, itemIndex) {
        // noinspection JSSuspiciousNameCombination
        let xNoise = this.noiseGen.noiseByArea(
            itemIndex * this.indexRegionSeparation,
            this.axisRegions.x,
        );
        let yNoise = this.noiseGen.noiseByArea(
            itemIndex * this.indexRegionSeparation,
            this.axisRegions.y,
        );
        let zNoise = this.noiseGen.noiseByArea(
            itemIndex * this.indexRegionSeparation,
            this.axisRegions.z,
        );

        let x = center.x + (radius + xNoise * this.noiseScale.x) * Math.cos(angle);
        const elevationDirectionOverride = this.elevator.getElevationDirectionOverride(center, elevation);
        const elevationDiff = yNoise * this.noiseScale.y;
        const elevationDirection = elevationDirectionOverride !== 0 ? elevationDirectionOverride : Math.sign(elevationDiff);
        let y = elevation + abs(elevationDiff) * elevationDirection;
        let z = center.z + (radius + zNoise * this.noiseScale.z) * Math.sin(angle);

        return createVector(x, y, z);
    }
}

