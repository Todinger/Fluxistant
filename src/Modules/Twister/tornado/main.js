let angle = 0;
let kitten;

let tornado;
let tornadoImage;

const DEBRIS_COUNT = 0;

let center;

let buf;
let font;
let shdr;
let mainCamera;

function preload() {
    kitten = loadImage('tmp/skinFullRogueYecatsmailbox_walk.b2bd5c05e8ab.gif');
    tornadoImage = loadImage('assets/pixel-tornado.gif');
}

function setup() {
    // setAttributes('willReadFrequently', true);
    // let renderer = createCanvas(1920, 880, WEBGL);
    // renderer.canvas.getContext('2d', { willReadFrequently: true });
    createCanvas(1920, 880, WEBGL);
    shdr = createShader(vert, frag);
    tornado = new Tornado(tornadoImage, shdr);
    center = tornado.center;

    for (let i = 0; i < DEBRIS_COUNT; i++) {
        tornado.addDebris(new Debris(
            tornado,
            kitten,
            100,
            100,
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
    ));
}

/*
function draw() {
    background(0);

    // graphics.fill(255, 0, 255);
    // graphics.ellipse(mouseX, mouseY, 20);
    ambientLight(100);
    directionalLight(255, 255, 255, 0, 0, 1);
    rotateX(angle);
    rotateY(angle * 1.3);
    rotateZ(angle * 0.7);
    //
    // texture(love);
    // box(100);

    texture(love);

    plane(300, 300);

    angle += 0.03;
}
*/

function draw() {
    background(120);
    // camera(width/2, height/2, (height/2) / tan(PI/6), width/2, height/2, 0, 0, 1, 0);
    mainCamera.camera(0, -height / 2, 800, 0, -height / 2, 0, 0, 1, 0);
    ambientLight(255);
    // directionalLight(255, 255, 255, 0, 0, 1);
    noStroke();

    // buf.push();
    // rotateX(angle);
    // rotateY(angle * 1.3);
    // rotateZ(angle * 0.7);
    // buf.texture(kitten);
    // buf.textFont()
    // buf.text("Hello");
    // buf.plane(300, 300);
    // buf.pop();

    // push();
    // // // rotateX(angle);
    // // // rotateY(angle * 1.3);
    // // // rotateZ(angle * 0.7);
    // // fill(0,0,0,0);
    // translate(center);
    // shader(shdr);
    // texture(tornadoImage);
    // // fill(0,0,0,255);
    // // textFont(font);
    // // text("Hi", 150, 50);
    // let tornadoSize = min(width, height);
    // plane(tornadoSize, tornadoSize);
    // pop();



    tornado.tick();
}


/**
 * demonstrates how to load a GIF image using
 * createImg to create an <img> on the page
 * and to use that to update animation
 * (and illustrates how p5's loadImage loads only
 * one frame otherwise).
 */
/*
var gif_loadImg, gif_createImg;

function preload() {
  gif_loadImg = loadImage("vegetables.gif");
  gif_createImg = createImg("https://d2k2g0zg1te1mr.cloudfront.net/overlays/battle-box/assets/units/skinFullRogueYecatsmailbox_walk.b2bd5c05e8ab.gif");
}

function setup() {
  createCanvas(500, 700);
  background(0);
}

function draw() {
  // loads only first frame
  image(gif_loadImg, 50, 50);

  // updates animation frames by using an html
  // img element, positioning it over top of
  // the canvas.
  gif_createImg.position(50, 350);
}
*/











let vert = `
precision highp float;
precision highp int;

uniform mat4 uViewMatrix;

uniform bool uUseLighting;

uniform int uAmbientLightCount;
uniform vec3 uAmbientColor[5];

uniform int uDirectionalLightCount;
uniform vec3 uLightingDirection[5];
uniform vec3 uDirectionalDiffuseColors[5];
uniform vec3 uDirectionalSpecularColors[5];

uniform int uPointLightCount;
uniform vec3 uPointLightLocation[5];
uniform vec3 uPointLightDiffuseColors[5];	
uniform vec3 uPointLightSpecularColors[5];

uniform int uSpotLightCount;
uniform float uSpotLightAngle[5];
uniform float uSpotLightConc[5];
uniform vec3 uSpotLightDiffuseColors[5];
uniform vec3 uSpotLightSpecularColors[5];
uniform vec3 uSpotLightLocation[5];
uniform vec3 uSpotLightDirection[5];

uniform bool uSpecular;
uniform float uShininess;

uniform float uConstantAttenuation;
uniform float uLinearAttenuation;
uniform float uQuadraticAttenuation;

const float specularFactor = 2.0;
const float diffuseFactor = 0.73;

struct LightResult {
  float specular;
  float diffuse;
};

float _phongSpecular(
  vec3 lightDirection,
  vec3 viewDirection,
  vec3 surfaceNormal,
  float shininess) {

  vec3 R = reflect(lightDirection, surfaceNormal);
  return pow(max(0.0, dot(R, viewDirection)), shininess);
}

float _lambertDiffuse(vec3 lightDirection, vec3 surfaceNormal) {
  return max(0.0, dot(-lightDirection, surfaceNormal));
}

LightResult _light(vec3 viewDirection, vec3 normal, vec3 lightVector) {

  vec3 lightDir = normalize(lightVector);

  //compute our diffuse & specular terms
  LightResult lr;
  if (uSpecular)
    lr.specular = _phongSpecular(lightDir, viewDirection, normal, uShininess);
  lr.diffuse = _lambertDiffuse(lightDir, normal);
  return lr;
}

void totalLight(
  vec3 modelPosition,
  vec3 normal,
  out vec3 totalDiffuse,
  out vec3 totalSpecular
) {

  totalSpecular = vec3(0.0);

  if (!uUseLighting) {
    totalDiffuse = vec3(1.0);
    return;
  }

  totalDiffuse = vec3(0.0);

  vec3 viewDirection = normalize(-modelPosition);

  for (int j = 0; j < 5; j++) {
    if (j < uDirectionalLightCount) {
      vec3 lightVector = (uViewMatrix * vec4(uLightingDirection[j], 0.0)).xyz;
      vec3 lightColor = uDirectionalDiffuseColors[j];
      vec3 specularColor = uDirectionalSpecularColors[j];
      LightResult result = _light(viewDirection, normal, lightVector);
      totalDiffuse += result.diffuse * lightColor;
      totalSpecular += result.specular * lightColor * specularColor;
    }

    if (j < uPointLightCount) {
      vec3 lightPosition = (uViewMatrix * vec4(uPointLightLocation[j], 1.0)).xyz;
      vec3 lightVector = modelPosition - lightPosition;
    
      //calculate attenuation
      float lightDistance = length(lightVector);
      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);
      vec3 lightColor = lightFalloff * uPointLightDiffuseColors[j];
      vec3 specularColor = lightFalloff * uPointLightSpecularColors[j];

      LightResult result = _light(viewDirection, normal, lightVector);
      totalDiffuse += result.diffuse * lightColor;
      totalSpecular += result.specular * lightColor * specularColor;
    }

    if(j < uSpotLightCount) {
      vec3 lightPosition = (uViewMatrix * vec4(uSpotLightLocation[j], 1.0)).xyz;
      vec3 lightVector = modelPosition - lightPosition;
    
      float lightDistance = length(lightVector);
      float lightFalloff = 1.0 / (uConstantAttenuation + lightDistance * uLinearAttenuation + (lightDistance * lightDistance) * uQuadraticAttenuation);

      vec3 lightDirection = (uViewMatrix * vec4(uSpotLightDirection[j], 0.0)).xyz;
      float spotDot = dot(normalize(lightVector), normalize(lightDirection));
      float spotFalloff;
      if(spotDot < uSpotLightAngle[j]) {
        spotFalloff = 0.0;
      }
      else {
        spotFalloff = pow(spotDot, uSpotLightConc[j]);
      }
      lightFalloff *= spotFalloff;

      vec3 lightColor = uSpotLightDiffuseColors[j];
      vec3 specularColor = uSpotLightSpecularColors[j];
     
      LightResult result = _light(viewDirection, normal, lightVector);
      
      totalDiffuse += result.diffuse * lightColor * lightFalloff;
      totalSpecular += result.specular * lightColor * specularColor * lightFalloff;
    }
  }

  totalDiffuse *= diffuseFactor;
  totalSpecular *= specularFactor;
}

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

varying highp vec2 vVertTexCoord;
varying vec3 vDiffuseColor;
varying vec3 vSpecularColor;

void main(void) {

  vec4 viewModelPosition = uModelViewMatrix * vec4(aPosition, 1.0);
  gl_Position = uProjectionMatrix * viewModelPosition;

  vec3 vertexNormal = normalize(uNormalMatrix * aNormal);
  vVertTexCoord = aTexCoord;

  totalLight(viewModelPosition.xyz, vertexNormal, vDiffuseColor, vSpecularColor);

  for (int i = 0; i < 8; i++) {
    if (i < uAmbientLightCount) {
      vDiffuseColor += uAmbientColor[i];
    }
  }
}`;

let frag = `
precision highp float;

uniform vec4 uMaterialColor;
uniform vec4 uTint;
uniform sampler2D uSampler;
uniform bool isTexture;
uniform bool uEmissive;

varying highp vec2 vVertTexCoord;
varying vec3 vDiffuseColor;
varying vec3 vSpecularColor;

void main(void) {
  if(uEmissive && !isTexture) {
    gl_FragColor = uMaterialColor;
  }
  else {
    gl_FragColor = isTexture ? texture2D(uSampler, vVertTexCoord) * (uTint / vec4(255, 255, 255, 255)) : uMaterialColor;
    gl_FragColor.rgb = gl_FragColor.rgb * vDiffuseColor + vSpecularColor;
  }

  if (gl_FragColor.a == 0.0) {
    discard;
  }
}`;
