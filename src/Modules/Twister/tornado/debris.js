class Debris {
    constructor(tornado, center, elevation, index, image, imageWidth, imageHeight) {
        this.tornado = tornado;
        this.center = center;
        this.index = index;
        this.angle = random(0, 2 * PI);
        this.angularSpeedFactor = random(0.3, 2);
        this.distance = random(10, 400);
        this.spinDirection = -1;
        this.rotation = 0;
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

    updateTransform() {
        this.tornado.updateDebrisTransform(this);
        translate(this.position);
        rotateX(this.rotation.x);
        rotateY(this.rotation.y);
        rotateZ(this.rotation.z);
    }

    show() {
        texture(this.image);
        plane(this.imageWidth, this.imageHeight);
    }

    update() {
        push();
        this.updateTransform();
        this.show();
        pop();
    }
}
