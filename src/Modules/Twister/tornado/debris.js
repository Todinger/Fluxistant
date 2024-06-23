const SCALE_FACTOR_FOR_TOP = 2;

class Debris {
    constructor(tornado, image, imageWidth, imageHeight, shader) {
        this.position = createVector(0, 0, 0);
        this.rotation = createVector(0, 0, 0);
        this.angle = random(0, 2 * PI);
        this.angularSpeedFactor = random(0.3, 2);
        this.distance = 0;
        this.spinDirection = -1;

        this.image = image;
        this.imageWidth = imageWidth;
        this.imageHeight = imageHeight;
        this.shader = shader;
    }

    get top() {
        // If we're closer to the camera then the image height might not be enough,
        // so we add a bit more, which is hardly accurate, but should hopefully suffice
        // for our needs
        return this.position.y - (this.imageHeight / 2) * SCALE_FACTOR_FOR_TOP;
    }

    setTransform() {
        translate(this.position);
        rotateX(this.rotation.x);
        rotateY(this.rotation.y);
        rotateZ(this.rotation.z);
    }

    setDisplay() {
        shader(this.shader);
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
