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
    tornado = new Tornado(assets.tornado, alphaShader);
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

function throwIn(skinName) {
    if (!(skinName in assets.skins)) return;
    tornado.throwIn(new Debris(
        tornado,
        assets.skins[skinName],
        100,
        100,
        alphaShader,
    ));
}

function draw() {
    // background(120);
    background(0, 0, 0, 0);
    mainCamera.camera(0, -height / 2, 800, 0, -height / 2, 0, 0, 1, 0);
    ambientLight(255);
    noStroke();

    tornado.tick();
}



const eventHandlers = {
    start: () => tornado.start(),
    end: () => tornado.end(),
    grow: () => tornado.grow(),
    throwIn,
};


window.addEventListener('message', function(e) {
    let event = e.data[0];
    if (!(event in eventHandlers)) return;
    let argument = e.data[1];
    eventHandlers[event](argument);
}, false);
