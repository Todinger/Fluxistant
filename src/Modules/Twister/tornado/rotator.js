
const DEFAULT_ROTATION_RANGES = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    minZ: -0.2,
    maxZ: 0.2,
}


class Rotator {
    constructor(noiseGen, rotationRanges = DEFAULT_ROTATION_RANGES) {
        this.noiseGen = noiseGen;
        this.rotationRanges = rotationRanges;
        this.axisRegions = {
            x: 3000,
            y: 4000,
            z: 5000,
        };
        this.indexRegionSeparation = DEFAULT_INDEX_REGION_SEPARATION;
    }

    rotate(currentRotation, itemIndex) {
        let xDiff = 0, yDiff = 0, zDiff = 0;

        if (this.rotationRanges.maxX - this.rotationRanges.minX > 0) {
            // noinspection JSSuspiciousNameCombination
            xDiff = this.noiseGen.noiseByArea(
                itemIndex * this.indexRegionSeparation,
                this.axisRegions.x,
            );
            xDiff = map(xDiff, -1, 1, this.rotationRanges.minX, this.rotationRanges.maxX);
        }

        if (this.rotationRanges.maxY - this.rotationRanges.minY > 0) {
            yDiff = this.noiseGen.noiseByArea(
                itemIndex * this.indexRegionSeparation,
                this.axisRegions.y,
            );
            yDiff = map(yDiff, -1, 1, this.rotationRanges.minY, this.rotationRanges.maxY);
        }

        if (this.rotationRanges.maxZ - this.rotationRanges.minZ > 0) {
            zDiff = this.noiseGen.noiseByArea(
                itemIndex * this.indexRegionSeparation,
                this.axisRegions.z,
            );
            zDiff = map(zDiff, -1, 1, this.rotationRanges.minZ, this.rotationRanges.maxZ);
        }

        return createVector(currentRotation.x + xDiff, currentRotation.y + yDiff, currentRotation.z + zDiff);
    }
}
