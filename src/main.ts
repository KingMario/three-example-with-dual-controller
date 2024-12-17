import {
  AxesHelper,
  Matrix4,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { ColoredCube } from "./ColoredCube";
import { DualController } from "./DualController";

// Create the scene
const scene = new Scene();

// Create a camera, which determines what we'll see when we render the scene
const camera = new PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
// Set the initial position of the camera to be from the top-right looking towards the origin
camera.position.set(2, -8, 12);
camera.lookAt(0, 0, 0);

// Create a renderer and attach it to our document
const renderer = new WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x808080);
document.body.appendChild(renderer.domElement);

// Create an instance of ColoredCube
const coloredCube = new ColoredCube(0x00ff00, 0xff0000); // Green face color, black edge color

// Add the colored cube to our scene
scene.add(coloredCube);

// Add reference axes to the scene
const axesHelper = new AxesHelper(5); // Length of the axes
scene.add(axesHelper);

// Create an instance of DualController and attach the coloredCube
const dualController = new DualController(scene, camera, renderer.domElement);

const matrix4 = new Matrix4().fromArray([
  0.49999999999999994, -0.5000000000000004, 0.7071067811865477, 2,
  -0.5000000000000004, 0.4999999999999999, 0.7071067811865477, 1,
  -0.7071067811865477, -0.7071067811865477, -5.102800490722271e-16, 3, 0, 0, 0,
  1,
]);
coloredCube.applyMatrix4(matrix4);
dualController.attach(coloredCube);

dualController.addEventListener("transform", (event: any) => {
  const translation = event.detail.translation;
  const rotation = event.detail.rotation;

  document.getElementById("translation")!.innerText =
    `Translation: Vector: [${translation.vector.join(
      ", ",
    )}], Distance: ${translation.distance}`;
  document.getElementById("rotation")!.innerText =
    `Rotation: Axis: Origin: [${rotation.axis[0].join(
      ", ",
    )}], Direction: [${rotation.axis[1].join(", ")}], Angle: ${rotation.angle}`;
});

function animate() {
  requestAnimationFrame(animate);

  // Keep the size of the axes constant
  const scale = camera.position.length() / 10; // Adjust the divisor as needed
  axesHelper.scale.set(scale, scale, scale);

  renderer.render(scene, camera);
}

animate();

// Add event listener for 'keydown' event
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    dualController.detach();
    dualController.destroy();
  }
});
