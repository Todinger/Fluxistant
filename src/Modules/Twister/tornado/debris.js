class Debris {
    constructor(tornado, center, elevation, index, image, imageWidth, imageHeight) {
        this.tornado = tornado;
        this.center = center;
        this.index = index;
        this.angle = random(0, 2 * PI);
        this.angularSpeedFactor = random(0.3, 2);
        this.distance = random(10, 400);
        this.rotationDirection = -1;
        this.position = this.tornado.positioner.getPositionAroundCenter(
            this.center,
            this.distance,
            this.angle,
            elevation,
            this.index,
        );

        this.image = image;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
    }

    updatePosition() {
        this.tornado.updateDebrisPosition(this);
        translate(this.position);
    }

    show() {
        texture(this.image);
        plane(this.imageWidth, this.imageHeight);
    }

    update() {
        push();
        this.updatePosition();
        this.show();
        pop();
    }
}
