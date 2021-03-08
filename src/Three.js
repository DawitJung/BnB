import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";

const aimDefaultColor = 0x999933;

export default class Three {
  camera;
  scene;
  renderer;
  stats;
  aim;
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // aim
    const aimGeometry = new THREE.CircleGeometry(2, 100);
    const aimMaterial = new THREE.MeshBasicMaterial({
      color: aimDefaultColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      depthTest: false,
    });
    this.aim = new THREE.Mesh(aimGeometry, aimMaterial);
    this.camera.add(this.aim);
    this.aim.position.set(0, 0, -55);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 0, 500);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(this.scene.fog.color);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(this.renderer.domElement);

    // Stats.js
    this.stats = new Stats();
    document.body.appendChild(this.stats.dom);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const spotlight = new THREE.SpotLight(0xffffff, 0.99, 0, Math.PI / 4, 1);
    spotlight.position.set(10, 30, 20);
    spotlight.target.position.set(0, 0, 0);

    spotlight.castShadow = true;

    spotlight.shadow.camera.near = 10;
    spotlight.shadow.camera.far = 100;
    spotlight.shadow.camera.fov = 30;

    // spotlight.shadow.bias = -0.0001
    spotlight.shadow.mapSize.width = 10000;
    spotlight.shadow.mapSize.height = 10000;

    this.scene.add(spotlight);

    // Generic material
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });

    // Floor
    const floorGeometry = new THREE.PlaneBufferGeometry(300, 300, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    this.scene.add(floor);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  set aimColor(hexColor = aimDefaultColor) {
    this.aim.material.color.setHex(hexColor);
  }
}
