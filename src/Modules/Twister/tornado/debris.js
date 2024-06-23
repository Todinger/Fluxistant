class Debris {
    constructor(tornado, image, imageWidth, imageHeight) {
        this.position = createVector(0, 0, 0);
        this.rotation = createVector(0, 0, 0);
        this.angle = random(0, 2 * PI);
        this.angularSpeedFactor = random(0.3, 2);
        this.distance = 0;
        this.spinDirection = -1;

        this.image = image;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
    }

    setTransform() {
        translate(this.position);
        rotateX(this.rotation.x);
        rotateY(this.rotation.y);
        rotateZ(this.rotation.z);
    }

    setDisplay() {
        texture(this.image);
        plane(this.imageWidth, this.imageHeight);
    }

    show() {
        push();
        this.setTransform();
        this.setDisplay();
        pop();
    }
}
