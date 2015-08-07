var winWidth = window.innerWidth;
var winHeight = window.innerHeight;

//variables for THREE.js
var visContainer,
  camera,
  renderer,
  scene,
  sceneSize = 100;

//variables for leap.js
var controller,
  frame;

setupVis();

function setupVis() {

  controller = new Leap.controller();

  scene = new THREE.Scene();

  //input vars = (FOV, aspect ratio, near clipping plane, far clipping plane)
  camera = new THREE.PerspectiveCamera(
    75,
    winWidth / winHeight,
    sceneSize / 100,
    sceneSize * 4
  );

  camera.position.z = sceneSize;

  d3.select()

}
