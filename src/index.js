import "./index.css";

import { PointerLockControlsCannon } from "./PointerLockControlsCannon";
import Three from "./Three";
import Cannon from "./Cannon";

// cannon.js variables
let lastTime = performance.now();

const instructions = document.getElementById("instructions");

const three = new Three();
const cannon = new Cannon(three);
const controls = new PointerLockControlsCannon(three.camera, cannon.sphereBody);
cannon.controls = controls;
cannon.setBoxes(3);
three.scene.add(controls.getObject());

instructions.addEventListener("click", () => {
  controls.lock();
});

controls.addEventListener("lock", () => {
  controls.enabled = true;
  instructions.style.display = "none";
});

controls.addEventListener("unlock", () => {
  controls.enabled = false;
  instructions.style.display = null;
});

animate();

function animate() {
  requestAnimationFrame(animate);

  const deltaTime = performance.now() - lastTime;
  lastTime = performance.now();

  cannon.update();
  controls.update(deltaTime);
  three.renderer.render(three.scene, three.camera);
  three.stats.update();
}
