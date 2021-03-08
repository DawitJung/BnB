import * as THREE from "three";
import * as CANNON from "cannon-es";
import Color from "color";

const ballMaxVelocity = 30;
const ballColorRange = [0x999933, 0xccff33];

export default class Cannon {
  world;
  sphereBody;
  three;
  boxes = [];
  boxMeshes = [];
  balls = [];
  ballMeshes = [];
  sphereShape;
  controls;
  energy = 0;
  shootedEnergy = 0;
  remainedEnergy = 0;
  constructor(three) {
    this.three = three;
    this.world = new CANNON.World();

    // Tweak contact properties.
    // Contact stiffness - use to make softer/harder contacts
    this.world.defaultContactMaterial.contactEquationStiffness = 1e9;

    // Stabilization time in number of timesteps
    this.world.defaultContactMaterial.contactEquationRelaxation = 4;

    const solver = new CANNON.GSSolver();
    solver.iterations = 7;
    solver.tolerance = 0.1;
    this.world.solver = new CANNON.SplitSolver(solver);
    // use this to test non-split solver
    // this.world.solver = solver

    this.world.gravity.set(0, -20, 0);

    // Create a slippery material (friction coefficient = 0.0)
    const physicsMaterial = new CANNON.Material("physics");
    const physics_physics = new CANNON.ContactMaterial(
      physicsMaterial,
      physicsMaterial,
      {
        friction: 0.0,
        restitution: 0.0,
      }
    );

    // We must add the contact materials to the this.world
    this.world.addContactMaterial(physics_physics);

    // Create the user collision sphere
    const radius = 1.3;
    this.sphereShape = new CANNON.Sphere(radius);
    this.sphereBody = new CANNON.Body({ mass: 1, material: physicsMaterial });
    this.sphereBody.addShape(this.sphereShape);
    this.sphereBody.position.set(0, 5, 0);
    this.sphereBody.linearDamping = 0.9;
    this.world.addBody(this.sphereBody);

    // Create the ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: physicsMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);

    window.addEventListener("mousedown", this.readyToShoot.bind(this));
    window.addEventListener("mouseup", this.shoot.bind(this));
  }
  update() {
    if (!this.controls.enabled) return;
    if (this.remainedEnergy !== 0) {
      const up =
        this.remainedEnergy > 0
          ? Math.ceil(this.remainedEnergy / 3)
          : Math.floor(this.remainedEnergy / 3);
      this.controls.pitchObject.rotation.x += up * 0.001;
      this.remainedEnergy -= up;
      if (this.remainedEnergy === 0 && this.shootedEnergy !== 0) {
        this.remainedEnergy = Math.floor(this.shootedEnergy * -0.9);
        this.shootedEnergy = 0;
      }
    }
    this.world.step(1 / 60);
    if (this.energy) {
      this.energy++;
      this.three.aimColor = this.ballColor;
    }

    // Update ball positions
    for (let i = 0; i < this.balls.length; i++) {
      this.ballMeshes[i].position.copy(this.balls[i].position);
      this.ballMeshes[i].quaternion.copy(this.balls[i].quaternion);
    }

    // Update box positions
    for (let i = 0; i < this.boxes.length; i++) {
      this.boxMeshes[i].position.copy(this.boxes[i].position);
      this.boxMeshes[i].quaternion.copy(this.boxes[i].quaternion);
    }
  }
  setBoxes(count = 7) {
    const halfExtents = new CANNON.Vec3(1, 1, 1);
    const boxShape = new CANNON.Box(halfExtents);
    const boxGeometry = new THREE.BoxBufferGeometry(
      halfExtents.x * 2,
      halfExtents.y * 2,
      halfExtents.z * 2
    );
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0x888999 });
    for (let i = 0; i < count; i++) {
      const boxBody = new CANNON.Body({ mass: 3 });
      boxBody.addShape(boxShape);
      const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 1 + 1;
      const z = (Math.random() - 0.5) * 20;

      boxBody.position.set(x, y, z);
      boxMesh.position.copy(boxBody.position);

      boxMesh.castShadow = true;
      boxMesh.receiveShadow = true;

      this.world.addBody(boxBody);
      this.three.scene.add(boxMesh);
      this.boxes.push(boxBody);
      this.boxMeshes.push(boxMesh);
    }
  }
  readyToShoot(e) {
    if (e.button !== 0 || !this.controls.enabled) return;
    this.energy++;
  }
  shoot(e) {
    const ballShape = new CANNON.Sphere(0.2);
    const ballGeometry = new THREE.SphereBufferGeometry(
      ballShape.radius,
      32,
      32
    );
    // Returns a vector pointing the the diretion the camera is at
    const getShootDirection = () => {
      const vector = new THREE.Vector3(0, 0, 1);
      vector.unproject(this.three.camera);
      const ray = new THREE.Ray(
        this.sphereBody.position,
        vector.sub(this.sphereBody.position).normalize()
      );
      return ray.direction;
    };
    if (e.button !== 0 || this.energy === 0 || !this.controls.enabled) return;
    this.shootedEnergy = this.remainedEnergy = this.energy;
    this.energy = 0;
    // this.three.camera.rotateX(0.002);
    this.three.aimColor = undefined;
    const ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    ballBody.addEventListener("collide", e => {
      console.log(e.contact.getImpactVelocityAlongNormal());
    });
    const shootDirection = getShootDirection();
    const ballMaterial = new THREE.MeshMatcapMaterial({
      color: this.ballColor,
    });
    const ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);

    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;

    this.world.addBody(ballBody);
    this.three.scene.add(ballMesh);
    this.balls.push(ballBody);
    this.ballMeshes.push(ballMesh);
    if (this.balls.length > 100) {
      this.world.removeBody(this.balls.shift());
      this.three.scene.remove(this.ballMeshes.shift());
    }

    ballBody.velocity.set(
      shootDirection.x * Math.min(this.remainedEnergy, ballMaxVelocity) +
        this.controls.velocity.x,
      shootDirection.y * Math.min(this.remainedEnergy, ballMaxVelocity) +
        this.controls.velocity.y,
      shootDirection.z * Math.min(this.remainedEnergy, ballMaxVelocity) +
        this.controls.velocity.z
    );

    // Move the ball outside the player sphere
    const x =
      this.sphereBody.position.x +
      shootDirection.x * (this.sphereShape.radius * 1.02 + ballShape.radius);
    const y =
      this.sphereBody.position.y +
      shootDirection.y * (this.sphereShape.radius * 1.02 + ballShape.radius);
    const z =
      this.sphereBody.position.z +
      shootDirection.z * (this.sphereShape.radius * 1.02 + ballShape.radius);
    ballBody.position.set(x, y, z);
    ballMesh.position.copy(ballBody.position);
  }
  get ballColor() {
    const baseColor = Color(ballColorRange[0]);
    const ballColor = baseColor.mix(
      Color(ballColorRange[1]),
      Math.min(1, (this.energy || this.remainedEnergy) / ballMaxVelocity)
    );
    return ballColor.rgbNumber();
  }
}
