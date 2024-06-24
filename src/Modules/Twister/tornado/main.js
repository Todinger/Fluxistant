let angle = 0;
let kitten;

let tornado;
let tornadoImage;

const DEBRIS_COUNT = 0;

let center;

let buf;
let font;
let alphaShader;
let mainCamera;
const canvasWidth = 1920;
const canvasHeight = 880;
const canvasLeft = -canvasWidth / 2;
const canvasRight = canvasWidth / 2;
const canvasTop = -canvasHeight;
const canvasBottom = 0;

function preload() {
    kitten = loadImage('tmp/skinFullRogueYecatsmailbox_walk.b2bd5c05e8ab.gif');
    tornadoImage = loadImage('assets/pixel-tornado.gif');
}

function setup() {
    createCanvas(canvasWidth, canvasHeight, WEBGL);
    alphaShader = createShader(vert, frag);
    tornado = new Tornado(tornadoImage, alphaShader);
    center = tornado.center;

    for (let i = 0; i < DEBRIS_COUNT; i++) {
        tornado.addDebris(new Debris(
            tornado,
            kitten,
            100,
            100,
            alphaShader,
        ));
    }

    mainCamera = createCamera();
}

function whee() {
    tornado.throwIn(new Debris(
        tornado,
        kitten,
        100,
        100,
        alphaShader,
    ));
}

function draw() {
    background(120);
    mainCamera.camera(0, -height / 2, 800, 0, -height / 2, 0, 0, 1, 0);
    ambientLight(255);
    noStroke();

    tornado.tick();
}
