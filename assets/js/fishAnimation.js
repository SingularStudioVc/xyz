import * as THREE from 'three';
import { Flow } from "three/examples/jsm/modifiers/CurveModifier";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import transformSVGPath from "https://000680810.codepen.website/scripts/transformSVGPath.js";

// SETTINGS
let fishPoints = [];
let flows = []
let fishCount = 15; // Number of red fishs
let frequency = 11;
let amplitude = 0.03;
let pointCount = 100;
let showLines = true;
let svgName = "circle";

// SIZES
let sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};
// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141724);

// RENDERER
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'), antialias: false
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// CAMERA
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.01,
  2000
);
camera.position.set(0, 1, 2);
camera.lookAt(0, 0, 0);
scene.add(camera);

// LIGHT
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(1, 2, 1)

const ambLight = new THREE.AmbientLight(0xffffff, 1.25, 100);
scene.add(pointLight, ambLight);

// ANIMATE
const animate = () => {
  requestAnimationFrame(animate);
  for (let i = 0; i < flows.length; i++) {
    flows[i].moveAlongCurve(0.0008);
  }
  renderer.render(scene, camera);
};

// LOAD
const loader = new GLTFLoader();
/* 
  FISH FROM https://poly.pizza/m/3GPUntjwqCa
  Goldfish by Poly by Google [CC-BY], via Poly Pizza
*/
loader.load("./fish_2.glb", function (gltf) {
  const redFish = gltf.scene
  const svg = document.getElementById(svgName);
  const origPoints = getCenteredSVGPoints(svg, 0.025);
  fishPoints = getFishPointsFromPoints(origPoints.reverse());
  const fishCurve = new THREE.CatmullRomCurve3(fishPoints, true);

  followPoints(redFish, fishCurve);

  animate();
});

loader.load("./fish_1.glb", function (gltf) {
  const blueFish = gltf.scene
  const minShift = -0.5;
  const maxShift = 0.5;
  const step = (Math.abs(minShift) + Math.abs(maxShift)) / fishCount;
  const shifts = range(minShift, maxShift, step);

  const fishPointsReversed = [...fishPoints].reverse();

  for (let i = 0; i < fishCount; i++) {
    let start = (Math.floor(Math.random() * 100) + 1) / 100;
    let end = 1 - start;
    let points = fishPointsReversed.slice(-start * pointCount).concat(fishPointsReversed.slice(0, end * pointCount))
    let fishCurve = new THREE.CatmullRomCurve3(shiftPoints(points, shifts[i]), true);
    let scale = (Math.floor(Math.random() * 50) + 40) / 100;
    blueFish.scale.set(scale, scale, scale);
    followPoints(blueFish, fishCurve);
  }

});

const shiftPoints = (points, shift) => {
  const shifted_fishpoints = points.map((point) => {
    let v = new THREE.Vector3(point.x, point.y + shift, point.z);
    return v;
  });
  return shifted_fishpoints
};

const followPoints = (fish, curve) => {
  flows.push(new Flow(fish));
  flows[flows.length - 1].updateCurve(0, curve);
  scene.add(flows[flows.length - 1].object3D);
};

function normalize(min, max) {
  var delta = max - min;
  return function (val) {
    return (val - min) / delta;
  };
}

// Scroll Animation

function moveCamera() {
  const t = document.body.getBoundingClientRect().top;
  camera.position.set(0, 1 + t * 0.01, 2 + t * 0.01);
}

document.body.onscroll = moveCamera;

const range = (start, stop, step = 1) => Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step);

const getCenteredSVGPoints = (svg, scale) => {
  const viewBox = svg.getAttribute("viewBox").split(" ");
  const width = parseFloat(viewBox[2]);
  const height = parseFloat(viewBox[3]);
  const path = svg.querySelector("path").getAttribute("d");
  const shape = transformSVGPath(path);
  const points = shape.getPoints(pointCount).map((point) => {
    let v = new THREE.Vector3(point.x - width / 2, 0, point.y - height / 2);
    v = v.multiplyScalar(scale);
    return v;
  });
  return points;
};
const getFishPointsFromPoints = (points) => {
  const fishPoints = [];
  const curve = new THREE.CatmullRomCurve3(points);
  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const angle = (i / (pointCount / frequency)) % 1;
    const displacement = Math.sin(Math.PI * 2 * angle) * amplitude;
    let point = curve.getPoint(t);
    const tangeant = curve.getTangent(t);
    const normal = tangeant.clone().cross(new THREE.Vector3(0, 1, 0));

    point = point.add(normal.multiplyScalar(displacement));
    fishPoints.push(point);
  }
  return fishPoints
};

const showLineFromPoints = (points, color) => {
  if (showLines) {
    const line = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({ color: color })
    );
    line.geometry.center();

    scene.add(line);
  }
};
const onWindowResize = () => {
  sizes = {
    width: window.innerWidth,
    height: window.innerHeight
  };

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
};

window.addEventListener("resize", onWindowResize, false);
