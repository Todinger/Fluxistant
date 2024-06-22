class Debris {
    constructor(tornado, center, index, image, width, height) {
        this.tornado = tornado;
        this.center = center;
        this.index = index;
        this.angle = random(0, 2 * PI);
        this.distance = 300; //random(10, 400);
        this.rotationDirection = random([-1, 1]);
        let elevation = center.y; // * random(0.2, 2);
        this.position = this.tornado.positioner.getPositionAroundCenter(
            this.center,
            this.distance,
            this.angle,
            elevation,
            this.index
        );

        this.image = image;
        this.width = width;
        this.height = height;
    }

    updatePosition() {
        this.angle = this.tornado.spinner.spin(this.angle, this.rotationDirection);
        this.position = this.tornado.positioner.getPositionAroundCenter(
            this.center,
            this.distance,
            this.angle,
            this.position.y,
            this.index,
        );

        translate(this.position);
    }

    show() {
        push();
        texture(this.image);
        plane(this.width, this.height);
        pop();
    }
}
