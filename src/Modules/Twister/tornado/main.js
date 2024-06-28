let angle = 0;
let kitten;

let tornado;

const DEBRIS_COUNT = 0;

let center;

let buf;
let font;
let alphaShader;
let mainCamera;
let canvasWidth;
let canvasHeight;
let canvasLeft = -canvasWidth / 2;
let canvasRight = canvasWidth / 2;
let canvasTop = -canvasHeight;
let canvasBottom = 0;

let assets;

function preload() {
    assets = loadAssets();
}

function setup() {
    canvasWidth = windowWidth;
    canvasHeight = windowHeight;
    canvasLeft = -canvasWidth / 2;
    canvasRight = canvasWidth / 2;
    canvasTop = -canvasHeight;
    canvasBottom = 0;
    createCanvas(canvasWidth, canvasHeight, WEBGL);
    alphaShader = createShader(vert, frag);
    tornado = new Tornado(assets.tornado, alphaShader, tornadoFinaleDone);
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
        assets.skins.skinFullRogueYecatsmailbox,
        100,
        100,
        alphaShader,
    ));
}

function makeDebris(skinName) {
    if (!(skinName in assets.skins)) {
        assets.skins[skinName] = loadImage(`assets/skins/${skinName}.gif`);
    }

    return new Debris(
        tornado,
        assets.skins[skinName],
        100,
        100,
        alphaShader,
    );
}

function throwIn(skinName) {
    tornado.throwIn(makeDebris(skinName));
}

function addIn(skinName) {
    tornado.addDebris(makeDebris(skinName));
}

function draw() {
    // background(120);
    background(0, 0, 0, 0);
    mainCamera.camera(0, -height / 2, 800, 0, -height / 2, 0, 0, 1, 0);
    ambientLight(255);
    noStroke();

    tornado.tick();
}

function tornadoFinaleDone() {
    window.parent.postMessage(["finaleDone", null], "*");
}

const eventHandlers = {
    start: (level) => tornado.start(level),
    end: () => tornado.end(),
    grow: () => tornado.grow(),
    throwIn,
    addIn,
};


window.addEventListener('message', function(e) {
    let event = e.data[0];
    if (!(event in eventHandlers)) return;
    let argument = e.data[1];
    eventHandlers[event](argument);
}, false);
