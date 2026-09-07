(() => {
  "use strict";

  if (!window.THREE) {
    console.warn("THREE.js not found, falling back to Canvas renderer.");
    return;
  }

  const { __BAG__ } = window;
  const container = document.getElementById("stage");
  const canvas2d = document.getElementById("c");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    renderer.setSize(canvas2d.width, canvas2d.height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.93;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.top = "0";
    renderer.domElement.style.left = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.objectFit = "cover";
  } catch (e) {
    console.warn("WebGL initialization failed, falling back to Canvas renderer.", e);
    return;
  }

  container.insertBefore(renderer.domElement, canvas2d);

  const skyCanvas = document.createElement("canvas");
  skyCanvas.width = 512;
  skyCanvas.height = 256;
  const skyCtx = skyCanvas.getContext("2d");
  const skyGrad = skyCtx.createLinearGradient(0, 0, 0, 256);
  skyGrad.addColorStop(0, "#3d98cc");
  skyGrad.addColorStop(0.46, "#8bc8dc");
  skyGrad.addColorStop(0.75, "#f3e6c8");
  skyGrad.addColorStop(1, "#cf8659");
  skyCtx.fillStyle = skyGrad;
  skyCtx.fillRect(0, 0, 512, 256);
  const skyTex = new THREE.CanvasTexture(skyCanvas);

  const scene = new THREE.Scene();
  scene.background = skyTex;
  scene.fog = new THREE.FogExp2("#d8c6a4", 0.00018);

  const camera = new THREE.PerspectiveCamera(39, canvas2d.width / canvas2d.height, 1, 3000);
  camera.position.set(__BAG__.W / 2, -260, 925);

  const hemiLight = new THREE.HemisphereLight("#fff8df", "#563421", 1.04);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight("#fff1c9", 1.42);
  dirLight.position.set(__BAG__.W / 2 - 850, 720, 640);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -__BAG__.W;
  dirLight.shadow.camera.right = __BAG__.W;
  dirLight.shadow.camera.top = __BAG__.W;
  dirLight.shadow.camera.bottom = -__BAG__.W;
  dirLight.shadow.camera.near = 100;
  dirLight.shadow.camera.far = 3000;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight("#88e4e8", 0.34);
  rimLight.position.set(__BAG__.W + 220, 260, 520);
  scene.add(rimLight);

  const groundCanvas = document.createElement("canvas");
  groundCanvas.width = 512; groundCanvas.height = 512;
  const gctx = groundCanvas.getContext("2d");
  gctx.fillStyle = "#3A2A1C";
  gctx.fillRect(0,0,512,512);
  gctx.fillStyle = "rgba(0,0,0,0.15)";
  gctx.fillRect(0, 248, 512, 16);
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.wrapS = THREE.RepeatWrapping;
  groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(10, 10);
  const dirtMaterial = new THREE.MeshStandardMaterial({ color: "#70462d", roughness: 0.94, metalness: 0.02, flatShading: true });
  const juiceMaterial = new THREE.MeshStandardMaterial({ color: __BAG__.COLORS.juice, roughness: 0.24, metalness: 0.08 });

  let terrainMesh;
  let terrainGeometry;

  function rebuildTerrain() {
    if (terrainMesh) scene.remove(terrainMesh);
    terrainGeometry = new THREE.PlaneGeometry(__BAG__.W, 800, __BAG__.terrain.length - 1, 16);

    const pos = terrainGeometry.attributes.position;
    for (let i = 0; i < __BAG__.terrain.length; i++) {
      const baseY = -__BAG__.baseTerrain[i];
      for (let j = 0; j <= 16; j++) {
        const z = -400 + (j / 16) * 800;
        pos.setXYZ(i + j * __BAG__.terrain.length, i * __BAG__.CELL - __BAG__.W/2, baseY, z);
      }
    }
    terrainGeometry.computeVertexNormals();

    terrainMesh = new THREE.Mesh(terrainGeometry, dirtMaterial);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;

    terrainMesh.position.set(__BAG__.W / 2, 0, 0);
    scene.add(terrainMesh);
  }

  let lastCratersLen = 0;

  function updateTerrainCraters() {
    if (!terrainGeometry) return;
    const craters = __BAG__.state.craters || [];
    if (craters.length === lastCratersLen) return;
    lastCratersLen = craters.length;

    const pos = terrainGeometry.attributes.position;
    for (let i = 0; i < __BAG__.terrain.length; i++) {
      let baseY = -__BAG__.baseTerrain[i];
      const vx = i * __BAG__.CELL;
      for (let j = 0; j <= 16; j++) {
        const vz = -400 + (j / 16) * 800;
        let y = baseY;
        for (const c of craters) {
          const dx = vx - c.x;
          const dz = vz - (c.z || 0);
          const dist = Math.hypot(dx, dz);
          if (dist <= c.radius) {
            const bowl = Math.pow(Math.cos((dist / c.radius) * Math.PI * 0.5), 2);
            y -= c.depth * bowl;
          }
        }
        pos.setY(i + j * __BAG__.terrain.length, y);
      }
    }
    terrainGeometry.attributes.position.needsUpdate = true;
    terrainGeometry.computeVertexNormals();
  }

  rebuildTerrain();

  const environment = new THREE.Group();
  scene.add(environment);

  const MAT = {
    cream: new THREE.MeshStandardMaterial({ color: "#f3e6c8", roughness: 0.82, flatShading: true }),
    wheat: new THREE.MeshStandardMaterial({ color: "#c98b45", roughness: 0.9, flatShading: true }),
    rust: new THREE.MeshStandardMaterial({ color: "#94472f", roughness: 0.82, metalness: 0.12, flatShading: true }),
    steel: new THREE.MeshStandardMaterial({ color: "#252e32", roughness: 0.5, metalness: 0.78, flatShading: true }),
    steelLight: new THREE.MeshStandardMaterial({ color: "#77858b", roughness: 0.38, metalness: 0.82, flatShading: true }),
    rubber: new THREE.MeshStandardMaterial({ color: "#15191a", roughness: 0.92, metalness: 0.04, flatShading: true }),
    oxblood: new THREE.MeshStandardMaterial({ color: "#6b1c2a", roughness: 0.4, metalness: 0.28, flatShading: true }),
    oxbloodDark: new THREE.MeshStandardMaterial({ color: "#32111b", roughness: 0.56, metalness: 0.22, flatShading: true }),
    olive: new THREE.MeshStandardMaterial({ color: "#31543f", roughness: 0.48, metalness: 0.3, flatShading: true }),
    oliveDark: new THREE.MeshStandardMaterial({ color: "#142a22", roughness: 0.64, metalness: 0.24, flatShading: true }),
    copper: new THREE.MeshStandardMaterial({ color: "#a85d3d", roughness: 0.44, metalness: 0.75, flatShading: true }),
    grape: new THREE.MeshStandardMaterial({ color: "#5a1638", roughness: 0.26, metalness: 0.04, flatShading: true }),
    grapeDark: new THREE.MeshStandardMaterial({ color: "#301326", roughness: 0.5, metalness: 0.05, flatShading: true }),
    cyan: new THREE.MeshStandardMaterial({ color: "#79dce1", emissive: "#167683", emissiveIntensity: 0.72, roughness: 0.22, metalness: 0.2 }),
    glassPurple: new THREE.MeshStandardMaterial({ color: "#8b2d74", emissive: "#451236", emissiveIntensity: 0.35, transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.08 }),
    ink: new THREE.MeshBasicMaterial({ color: "#171312" })
  };

  const pipFaceCanvas = document.createElement("canvas");
  pipFaceCanvas.width = 64;
  pipFaceCanvas.height = 64;
  const pipFaceCtx = pipFaceCanvas.getContext("2d");
  pipFaceCtx.clearRect(0, 0, 64, 64);
  pipFaceCtx.strokeStyle = "#171312";
  pipFaceCtx.fillStyle = "#f3e6c8";
  pipFaceCtx.lineWidth = 6;
  pipFaceCtx.lineCap = "round";
  pipFaceCtx.beginPath();
  pipFaceCtx.arc(21, 29, 5, 0, Math.PI * 2);
  pipFaceCtx.arc(43, 29, 5, 0, Math.PI * 2);
  pipFaceCtx.fill();
  pipFaceCtx.beginPath();
  pipFaceCtx.moveTo(11, 17); pipFaceCtx.lineTo(27, 22);
  pipFaceCtx.moveTo(53, 17); pipFaceCtx.lineTo(37, 22);
  pipFaceCtx.moveTo(20, 49); pipFaceCtx.quadraticCurveTo(32, 42, 45, 49);
  pipFaceCtx.stroke();
  const pipFaceTexture = new THREE.CanvasTexture(pipFaceCanvas);
  const pipFaceMaterial = new THREE.MeshBasicMaterial({ map: pipFaceTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide });

  const splatCanvas = document.createElement("canvas");
  splatCanvas.width = 128;
  splatCanvas.height = 64;
  const splatCtx = splatCanvas.getContext("2d");
  splatCtx.fillStyle = "#fff";
  splatCtx.beginPath();
  splatCtx.ellipse(64, 35, 39, 16, -0.08, 0, Math.PI * 2);
  splatCtx.fill();
  for (const [x, y, r] of [[18, 19, 7], [106, 13, 5], [111, 43, 8], [32, 52, 5], [77, 9, 4]]) {
    splatCtx.beginPath();
    splatCtx.arc(x, y, r, 0, Math.PI * 2);
    splatCtx.fill();
  }
  const splatTexture = new THREE.CanvasTexture(splatCanvas);

  function makeMachineLabel(title, subtitle, accent) {
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 384;
    labelCanvas.height = 128;
    const ctx = labelCanvas.getContext("2d");
    ctx.fillStyle = "rgba(24, 13, 12, 0.88)";
    ctx.roundRect(4, 4, 376, 120, 16);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = "#f3e6c8";
    ctx.textAlign = "center";
    ctx.font = "900 62px Arial Narrow, Arial";
    ctx.fillText(title, 192, 68);
    ctx.fillStyle = accent;
    ctx.font = "800 24px Arial Narrow, Arial";
    ctx.fillText(subtitle, 192, 103);
    const texture = new THREE.CanvasTexture(labelCanvas);
    texture.minFilter = THREE.LinearFilter;
    return new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
  }

  const sidewinderLabel = makeMachineLabel("YARD 12", "TWIN-FLYWHEEL", "#79dce1");
  const bootleggerLabel = makeMachineLabel("LATE 09", "PRESSURE-LARIAT", "#c57a55");

  function addMesh(parent, geometry, material, position, rotation = null, scale = null, outline = false) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(position[0], position[1], position[2]);
    if (rotation) item.rotation.set(rotation[0], rotation[1], rotation[2]);
    if (scale) item.scale.set(scale[0], scale[1], scale[2]);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    geometry.computeBoundingBox();
    const outlineSize = new THREE.Vector3();
    geometry.boundingBox?.getSize(outlineSize);
    const keepOutline = outline && Math.max(outlineSize.x, outlineSize.y, outlineSize.z) >= 48;
    if (keepOutline) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 24),
        new THREE.LineBasicMaterial({ color: "#1a100c", transparent: true, opacity: 0.58 })
      );
      item.add(edges);
    }
    return item;
  }

  function buildEnvironment() {
    const sun = new THREE.Mesh(new THREE.CircleGeometry(74, 32), new THREE.MeshBasicMaterial({ color: "#ffe8ae", fog: false }));
    sun.position.set(970, -130, -520);
    environment.add(sun);

    const elevator = new THREE.Group();
    addMesh(elevator, new THREE.BoxGeometry(112, 190, 72), MAT.cream, [0, 95, 0], null, null, true);
    for (const x of [-34, 0, 34]) addMesh(elevator, new THREE.CylinderGeometry(18, 21, 174, 10), MAT.steelLight, [x, 91, 45]);
    addMesh(elevator, new THREE.BoxGeometry(148, 18, 76), MAT.rust, [0, 188, 14], null, null, true);
    addMesh(elevator, new THREE.BoxGeometry(18, 82, 18), MAT.steel, [58, 223, 8]);
    elevator.position.set(1020, -505, -330);
    elevator.scale.setScalar(0.72);
    environment.add(elevator);

    const windmill = new THREE.Group();
    addMesh(windmill, new THREE.CylinderGeometry(2.5, 5.5, 160, 6), MAT.steel, [0, 80, 0]);
    const rotor = new THREE.Group();
    for (let i = 0; i < 10; i += 1) {
      const blade = addMesh(rotor, new THREE.BoxGeometry(7, 54, 1.5), MAT.steelLight, [0, 26, 0]);
      blade.rotation.z = i / 10 * Math.PI * 2;
    }
    addMesh(rotor, new THREE.CylinderGeometry(7, 7, 7, 10), MAT.copper, [0, 0, 3], [Math.PI / 2, 0, 0]);
    rotor.position.set(0, 160, 0);
    windmill.userData.rotor = rotor;
    windmill.add(rotor);
    windmill.position.set(155, -485, -300);
    windmill.scale.setScalar(0.72);
    environment.add(windmill);
    environment.userData.windmill = windmill;

    const pivot = new THREE.Group();
    addMesh(pivot, new THREE.BoxGeometry(430, 4, 4), MAT.steelLight, [0, 0, 0]);
    for (const x of [-170, -85, 0, 85, 170]) {
      addMesh(pivot, new THREE.CylinderGeometry(10, 10, 4, 10), MAT.rubber, [x, -25, 0], [Math.PI / 2, 0, 0]);
      addMesh(pivot, new THREE.BoxGeometry(3, 52, 3), MAT.steel, [x, -2, 0]);
    }
    pivot.position.set(640, -420, -360);
    pivot.scale.setScalar(0.82);
    environment.add(pivot);

    const wheatGeometry = new THREE.CylinderGeometry(0.7, 1.1, 24, 4);
    const wheat = new THREE.InstancedMesh(wheatGeometry, MAT.wheat, 120);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 120; i += 1) {
      const x = (i * 97) % __BAG__.W;
      const z = -110 - ((i * 43) % 210);
      const y = -__BAG__.groundAt(x, z) + 8 + (i % 4) * 2;
      matrix.makeTranslation(x, y, z);
      wheat.setMatrixAt(i, matrix);
    }
    wheat.instanceMatrix.needsUpdate = true;
    environment.add(wheat);
    environment.userData.wheat = wheat;
  }

  buildEnvironment();

  const projectileMeshes = new Map();
  const particleMeshes = new Map();
  const stainMeshes = new Map();
  const ringMeshes = new Map();
  const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
  const particleGeo = new THREE.PlaneGeometry(1, 1);

  const playerCartMesh = new THREE.Group();
  const enemyCartMesh = new THREE.Group();
  const crewMeshes = { player: [], enemy: [] };
  scene.add(playerCartMesh);
  scene.add(enemyCartMesh);
  let identityInitialized = false;

  function buildWheel(parent, x, z, radius = 24) {
    const wheel = new THREE.Group();
    wheel.position.set(x, radius, z);
    const tire = addMesh(wheel, new THREE.CylinderGeometry(radius, radius, 16, 16), MAT.rubber, [0, 0, 0], [Math.PI / 2, 0, 0]);
    addMesh(wheel, new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, 17, 12), MAT.steelLight, [0, 0, 0], [Math.PI / 2, 0, 0]);
    addMesh(wheel, new THREE.CylinderGeometry(radius * 0.23, radius * 0.23, 19, 10), MAT.copper, [0, 0, 0], [Math.PI / 2, 0, 0]);
    parent.add(wheel);
    return { wheel, tire };
  }

  function buildSidewinder() {
    const group = new THREE.Group();
    const suspension = new THREE.Group();
    group.add(suspension);

    addMesh(suspension, new THREE.BoxGeometry(190, 18, 62), MAT.steel, [0, 34, 0], null, null, true);
    addMesh(suspension, new THREE.BoxGeometry(172, 30, 58), MAT.oxbloodDark, [-6, 54, 0], [0, 0, -0.02], null, true);
    const cowling = addMesh(suspension, new THREE.BoxGeometry(108, 34, 66), MAT.oxblood, [-28, 76, 0], [0, 0, -0.12], null, true);
    addMesh(suspension, new THREE.PlaneGeometry(72, 24), sidewinderLabel, [-30, 77, 34.2], [0, 0, -0.12]);
    addMesh(suspension, new THREE.BoxGeometry(78, 9, 72), MAT.steelLight, [52, 50, 0], [0, 0, 0.08], null, true);

    const wheels = [];
    for (const [x, z, r] of [[-64, 38, 25], [62, 38, 28], [-64, -38, 25], [62, -38, 28]]) {
      wheels.push(buildWheel(suspension, x, z, r).wheel);
      const arm = addMesh(suspension, new THREE.BoxGeometry(48, 5, 6), MAT.copper, [x * 0.72, 42, z], [0, 0, x > 0 ? -0.22 : 0.22]);
      arm.userData.baseRotation = arm.rotation.z;
    }

    const hopper = addMesh(suspension, new THREE.CylinderGeometry(35, 27, 48, 4), MAT.oxblood, [-58, 112, 0], [0, Math.PI / 4, 0], null, true);
    addMesh(hopper, new THREE.BoxGeometry(63, 5, 56), MAT.steel, [0, 25, 0], null, null, true);
    for (const pos of [[-12, 20, 0], [0, 21, 8], [12, 20, -7], [-3, 22, -10]]) {
      addMesh(hopper, new THREE.SphereGeometry(7, 10, 8), MAT.grape, pos);
    }

    const accelerator = new THREE.Group();
    accelerator.position.set(63, 91, 0);
    suspension.add(accelerator);
    const drumGeometry = new THREE.CylinderGeometry(27, 27, 18, 18);
    drumGeometry.rotateX(Math.PI / 2);
    const drums = [];
    for (const y of [-25, 25]) {
      const drum = addMesh(accelerator, drumGeometry, MAT.rubber, [0, y, 0], null, null, true);
      addMesh(drum, new THREE.TorusGeometry(18, 3.2, 8, 18), MAT.copper, [0, 0, 9]);
      addMesh(drum, new THREE.CylinderGeometry(7, 7, 23, 10), MAT.grape, [0, 0, 0], [Math.PI / 2, 0, 0]);
      drums.push(drum);
    }
    addMesh(accelerator, new THREE.BoxGeometry(32, 92, 48), MAT.steel, [0, 0, -4], null, null, true);
    drums.forEach((drum) => accelerator.add(drum));

    const belt = new THREE.Group();
    belt.position.set(5, 111, 0);
    belt.rotation.z = -0.28;
    suspension.add(belt);
    addMesh(belt, new THREE.BoxGeometry(92, 7, 26), MAT.rubber, [0, 0, 0], null, null, true);
    const beltGrapes = [];
    for (let i = -2; i <= 2; i += 1) {
      const grape = addMesh(belt, new THREE.SphereGeometry(6, 10, 8), MAT.grape, [i * 17, 8, 0]);
      grape.userData.baseX = grape.position.x;
      beltGrapes.push(grape);
    }

    const tank = addMesh(suspension, new THREE.CylinderGeometry(17, 17, 52, 14), MAT.glassPurple, [-8, 103, 29], [0, 0, Math.PI / 2], null, true);
    addMesh(suspension, new THREE.BoxGeometry(48, 14, 4), MAT.cyan, [-8, 70, 34], null, null, true);
    addMesh(suspension, new THREE.CylinderGeometry(4, 5, 48, 8), MAT.steel, [-72, 112, -18], [0, 0, -0.07], null, true);
    addMesh(suspension, new THREE.CylinderGeometry(7, 4, 11, 8), MAT.copper, [-74, 138, -18]);
    addMesh(suspension, new THREE.BoxGeometry(18, 11, 8), MAT.cyan, [88, 63, 28], [0, 0, 0.08]);
    for (const x of [11, 28, 45]) addMesh(suspension, new THREE.BoxGeometry(9, 4, 69), MAT.copper, [x, 48, 0], [0, 0, -0.12]);
    const mast = new THREE.Group();
    mast.position.set(-25, 91, -20);
    suspension.add(mast);
    addMesh(mast, new THREE.CylinderGeometry(2.2, 3.5, 74, 7), MAT.steelLight, [0, 37, 0]);
    addMesh(mast, new THREE.BoxGeometry(20, 8, 13), MAT.steel, [0, 77, 0], null, null, true);
    addMesh(mast, new THREE.BoxGeometry(10, 3, 8), MAT.cyan, [0, 77, 7]);

    const grab = addMesh(suspension, new THREE.TorusGeometry(15, 3, 8, 18, Math.PI), MAT.copper, [94, 84, 0], [0, Math.PI / 2, Math.PI / 2]);
    grab.userData.isGrab = true;
    const haloMaterial = MAT.cyan.clone();
    haloMaterial.transparent = true;
    haloMaterial.opacity = 0.72;
    const grabHalo = addMesh(suspension, new THREE.TorusGeometry(22, 2.2, 8, 24), haloMaterial, [94, 84, 39]);
    group.scale.setScalar(1.08);
    return { group, suspension, cowling, hopper, accelerator, drums, belt, beltGrapes, tank, mast, wheels, grab, grabHalo };
  }

  function buildBootlegger() {
    const group = new THREE.Group();
    const suspension = new THREE.Group();
    group.add(suspension);
    addMesh(suspension, new THREE.BoxGeometry(172, 18, 62), MAT.steel, [0, 42, 0], null, null, true);
    addMesh(suspension, new THREE.BoxGeometry(150, 22, 57), MAT.oliveDark, [-2, 61, 0], null, null, true);

    const wheels = [];
    for (const [x, z, r] of [[-55, 38, 25], [55, 38, 25], [-55, -38, 25], [55, -38, 25]]) wheels.push(buildWheel(suspension, x, z, r).wheel);

    const hopper = addMesh(suspension, new THREE.CylinderGeometry(43, 34, 76, 5), MAT.olive, [-9, 109, 0], [0, Math.PI / 5, 0], null, true);
    addMesh(suspension, new THREE.PlaneGeometry(62, 22), bootleggerLabel, [-9, 111, 36.5], [0, 0, -0.04]);
    addMesh(hopper, new THREE.BoxGeometry(64, 5, 58), MAT.steel, [0, 40, 0], null, null, true);
    addMesh(suspension, new THREE.BoxGeometry(54, 15, 4), MAT.cream, [-9, 115, 35], [0, 0, -0.04], null, true);
    addMesh(suspension, new THREE.BoxGeometry(38, 15, 4), MAT.cyan, [28, 84, 34], null, null, true);
    addMesh(suspension, new THREE.CylinderGeometry(4, 6, 58, 8), MAT.steel, [-63, 116, -17], [0, 0, 0.08], null, true);
    addMesh(suspension, new THREE.CylinderGeometry(8, 4, 12, 8), MAT.copper, [-61, 148, -17]);
    addMesh(suspension, new THREE.BoxGeometry(17, 10, 8), MAT.cyan, [72, 68, 28]);

    const pressureTank = addMesh(suspension, new THREE.CylinderGeometry(18, 18, 104, 16), MAT.steelLight, [-4, 73, -24], [0, 0, Math.PI / 2], null, true);
    for (const x of [-38, 0, 38]) addMesh(suspension, new THREE.TorusGeometry(19, 2.8, 8, 14), MAT.copper, [x - 4, 73, -24], [0, Math.PI / 2, 0]);
    const accumulator = addMesh(suspension, new THREE.CylinderGeometry(10, 10, 42, 12), MAT.glassPurple, [-57, 88, 26], null, null, true);

    const pivot = new THREE.Group();
    pivot.position.set(29, 132, 0);
    suspension.add(pivot);
    const boom = addMesh(pivot, new THREE.BoxGeometry(112, 14, 18), MAT.steel, [47, 26, 0], [0, 0, 0.42], null, true);
    addMesh(boom, new THREE.BoxGeometry(77, 5, 23), MAT.copper, [3, 0, 0]);
    const piston = addMesh(pivot, new THREE.CylinderGeometry(5, 8, 80, 10), MAT.steelLight, [18, 16, -15], [0, 0, -1.1]);
    const yoke = new THREE.Group();
    yoke.position.set(103, 51, 0);
    pivot.add(yoke);
    addMesh(yoke, new THREE.BoxGeometry(11, 60, 13), MAT.oliveDark, [0, 20, 18], [0, 0, -0.16], null, true);
    addMesh(yoke, new THREE.BoxGeometry(11, 60, 13), MAT.oliveDark, [0, 20, -18], [0, 0, -0.16], null, true);
    addMesh(yoke, new THREE.TorusGeometry(20, 5, 8, 18, Math.PI), MAT.copper, [0, 52, 0], [Math.PI / 2, 0, 0]);
    const cup = addMesh(yoke, new THREE.SphereGeometry(13, 12, 10), MAT.grape, [22, 5, 0]);

    const feet = [];
    for (const [x, z] of [[-69, 29], [-69, -29], [69, 29], [69, -29]]) {
      const foot = new THREE.Group();
      foot.position.set(x, 32, z);
      foot.userData.baseY = foot.position.y;
      addMesh(foot, new THREE.CylinderGeometry(3, 4, 31, 7), MAT.steelLight, [0, -10, 0]);
      addMesh(foot, new THREE.CylinderGeometry(12, 8, 5, 8), MAT.rubber, [0, -28, 0]);
      suspension.add(foot);
      feet.push(foot);
    }

    group.scale.setScalar(1.04);
    return { group, suspension, hopper, pressureTank, accumulator, pivot, boom, piston, yoke, cup, feet, wheels };
  }

  function buildPipGroup(tint = MAT.grape) {
    const group = new THREE.Group();
    const berryGeometry = new THREE.SphereGeometry(6.8, 10, 8);
    const bodyPositions = [[-7, 18, 0], [7, 18, 0], [-10, 11, 1], [0, 12, 3], [10, 11, 1], [-5, 5, 2], [5, 5, 2]];
    const bodyBerries = new THREE.InstancedMesh(berryGeometry, tint, bodyPositions.length);
    const berryMatrix = new THREE.Matrix4();
    bodyPositions.forEach((position, index) => {
      berryMatrix.makeTranslation(position[0], position[1], position[2]);
      bodyBerries.setMatrixAt(index, berryMatrix);
    });
    bodyBerries.instanceMatrix.needsUpdate = true;
    bodyBerries.castShadow = true;
    group.add(bodyBerries);
    const face = addMesh(group, berryGeometry, MAT.grape, [0, 22, 0], null, [1.06, 1.06, 1.06]);
    addMesh(group, new THREE.PlaneGeometry(13, 13), pipFaceMaterial, [0, 22, 7.3]);
    const stem = addMesh(group, new THREE.CylinderGeometry(1.2, 1.8, 10, 7), MAT.oliveDark, [1, 31, 0], [0, 0, -0.24]);
    const armGeometry = new THREE.CylinderGeometry(0.9, 1.2, 14, 6);
    const leftArm = addMesh(group, armGeometry, MAT.oliveDark, [-15, 13, 0], [0, 0, -0.82]);
    const rightArm = addMesh(group, armGeometry, MAT.oliveDark, [15, 13, 0], [0, 0, 0.82]);
    for (const x of [-6, 6]) {
      addMesh(group, new THREE.CylinderGeometry(1.1, 1.4, 10, 6), MAT.oliveDark, [x, -2, 0]);
      addMesh(group, new THREE.BoxGeometry(8, 4, 10), MAT.rubber, [x + (x < 0 ? -1.5 : 1.5), -8, 1], [0, 0, x < 0 ? 0.08 : -0.08]);
    }
    const cloth = new THREE.Group();
    addMesh(cloth, new THREE.PlaneGeometry(14, 11), MAT.cream, [0, 0, 0], [0, 0, -0.18]);
    cloth.position.set(16, 13, 9);
    cloth.visible = false;
    group.add(cloth);
    const calipers = new THREE.Group();
    addMesh(calipers, new THREE.BoxGeometry(2, 18, 2), MAT.copper, [-4, 0, 0], [0, 0, -0.15]);
    addMesh(calipers, new THREE.BoxGeometry(2, 18, 2), MAT.copper, [4, 0, 0], [0, 0, 0.15]);
    addMesh(calipers, new THREE.BoxGeometry(12, 2, 2), MAT.steelLight, [0, 7, 0]);
    calipers.position.set(16, 16, 9);
    calipers.visible = false;
    group.add(calipers);
    const tackle = new THREE.Group();
    addMesh(tackle, new THREE.TorusGeometry(6, 2, 6, 12), MAT.copper, [0, 0, 0]);
    addMesh(tackle, new THREE.BoxGeometry(2, 27, 2), MAT.cream, [0, -16, 0]);
    tackle.position.set(15, 25, 9);
    tackle.visible = false;
    group.add(tackle);
    group.userData.restY = 10;
    group.userData.baseScaleX = 1;
    group.userData.parts = { bodyBerries, face, stem, leftArm, rightArm, cloth, calipers, tackle };
    group.scale.setScalar(1.18);
    return group;
  }

  function addPipCrew(group, side) {
    for (let index = 0; index < 5; index += 1) {
      const pip = buildPipGroup();
      pip.visible = false;
      group.add(pip);
      crewMeshes[side].push(pip);
    }
  }

  function updatePipCrew(state) {
    for (const side of ["player", "enemy"]) {
      const pips = crewMeshes[side];
      if (!pips.length) continue;
      const facing = side === "player" ? 1 : -1;
      const active = state.phase === "ceremony" && state.ceremony?.shooterId === side;
      const progress = active ? Math.min(1, state.ceremony.elapsed / state.ceremony.duration) : 0;
      const pulse = Math.sin(progress * Math.PI * 8);

      const pose = (index, x, lift = 0, z = 14, rotation = 0) => {
        const pip = pips[index];
        pip.visible = true;
        pip.position.set(x, pip.userData.restY + lift, z);
        pip.rotation.z = rotation;
        pip.scale.setScalar(1.18);
      };

      pips.forEach((pip) => {
        pip.visible = false;
        pip.userData.parts.cloth.visible = false;
        pip.userData.parts.calipers.visible = false;
        pip.userData.parts.tackle.visible = false;
      });

      if (!active) {
        pose(0, facing * 120, Math.sin(state.elapsed * 2.1) * 1.5, 42);

        // Recoil logic applied right after ceremony (during recoil phase of the cart)
        if (state.phase === "flight" && state.elapsed % 1 < 0.25) {
          pips[0].scale.y = 1.15;
        } else {
          pips[0].scale.y = 1.0;
        }
        continue;
      }

      const front = facing * 118;
      if (state.ceremony.lotId === "table") {
        pose(0, front - facing * 52, 3 + pulse * 2, 42, pulse * 0.055);
        pose(1, front - facing * 15, 8 + Math.abs(pulse) * 5, 45, -facing * 0.09);
        pose(2, front + facing * 25, 2, 40, facing * 0.08);
        pips[0].userData.parts.cloth.visible = true;
        pips[1].userData.parts.tackle.visible = true;
      } else if (state.ceremony.lotId === "pea") {
        pose(0, front - facing * 46, 1, 42, -facing * (0.08 + pulse * 0.05));
        pose(1, front + facing * 26, 1, 42, facing * (0.08 + pulse * 0.05));
        pose(2, front - facing * 82, 4 + Math.abs(pulse) * 8, 36, pulse * 0.12);
        pips[0].userData.parts.calipers.visible = true;
        pips[1].userData.parts.calipers.visible = true;
      } else if (state.ceremony.lotId === "cluster") {
        for (let index = 0; index < 5; index += 1) {
          pose(index, front + facing * ((index%2) ? 12 : -12), Math.floor(index/2) * 24 + Math.abs(pulse) * 3, 38 + index * 2, (index - 2) * 0.055);
        }
      } else {
        for (let index = 0; index < 4; index += 1) {
          pose(index, -facing * (62 + index * 25) + pulse * facing * 4, 1, 36 + index * 2, -facing * 0.14);
        }
        pose(4, front, 24 + Math.sin(progress * Math.PI) * 22, 44, facing * 0.1);
        pips[4].userData.parts.tackle.visible = true;
      }
    }
  }

  let playerCartModel, enemyCartModel;

  function initializeIdentity() {
    if (identityInitialized) return true;
    playerCartModel = buildSidewinder();
    playerCartMesh.add(playerCartModel.group);
    addPipCrew(playerCartMesh, "player");

    enemyCartModel = buildBootlegger();
    enemyCartModel.group.scale.x = -1.04;
    enemyCartMesh.add(enemyCartModel.group);
    addPipCrew(enemyCartMesh, "enemy");

    identityInitialized = true;
    canvas2d.style.opacity = "0";
    return true;
  }


  window.setTimeout(() => {
    if (identityInitialized) return;
    console.warn("Dimensional identity assets did not load; restoring Canvas renderer.");
    delete __BAG__.render3D;
    canvas2d.style.opacity = "1";
    renderer.domElement.remove();
    renderer.dispose();
  }, 5000);

  const ghostMaterial = new THREE.LineBasicMaterial({ color: __BAG__.COLORS.horizon, opacity: 0.5, transparent: true, linewidth: 2 });
  let ghostLine = null;
  let lastGhostId = null;
  const aimPreviewGroup = new THREE.Group();
  scene.add(aimPreviewGroup);
  const rubberBandGeo = new THREE.BufferGeometry();
  const rubberBandMat = new THREE.LineBasicMaterial({ color: "#7d1d63", linewidth: 3, transparent: true, opacity: 0.95 });
  const rubberBandLine = new THREE.Line(rubberBandGeo, rubberBandMat);
  aimPreviewGroup.add(rubberBandLine);
  const dotMeshes = [];
  const dotGeo = new THREE.SphereGeometry(3.6, 7, 6);
  const dotMat = new THREE.MeshBasicMaterial({ color: "#741957", transparent: true });
  for (let i = 0; i < 16; i++) {
    const dot = new THREE.Mesh(dotGeo, dotMat.clone());
    dotMeshes.push(dot);
    aimPreviewGroup.add(dot);
  }

  function buildProjectileMesh(projectile) {
    if (projectile.lotId === "lug") {
      const lug = new THREE.Group();
      addMesh(lug, new THREE.BoxGeometry(23, 23, 23), MAT.grapeDark, [0, 0, 0], [0.08, 0.12, -0.08], null, true);
      addMesh(lug, new THREE.BoxGeometry(28, 4, 26), MAT.copper, [0, 0, 0]);
      addMesh(lug, new THREE.BoxGeometry(4, 28, 26), MAT.copper, [0, 0, 0]);
      for (const pos of [[-6, 6, 7], [6, 6, 7], [-6, -6, 7], [6, -6, 7]]) addMesh(lug, new THREE.SphereGeometry(5, 8, 7), MAT.grape, pos);
      return lug;
    }
    if (projectile.lotId === "cluster" && !projectile.child) {
      const cluster = new THREE.Group();
      for (const pos of [[0,0,0],[-6,3,0],[6,3,0],[-4,-5,2],[4,-5,2],[0,6,3]]) addMesh(cluster, new THREE.SphereGeometry(5.2, 8, 7), MAT.grape, pos);
      return cluster;
    }
    const berry = new THREE.Mesh(sphereGeo, projectile.lotId === "pea" ? MAT.cream : MAT.grape);
    berry.scale.set(projectile.radius, projectile.radius, projectile.radius);
    berry.castShadow = true;
    return berry;
  }


  __BAG__.render3D = function() {
    const state = __BAG__.state;
    const carts = __BAG__.carts;

    initializeIdentity();

    updateTerrainCraters();

    if (__BAG__.gestureState && __BAG__.gestureState.valid && state.phase === "aim") {
      aimPreviewGroup.visible = true;
      const cart = carts[state.turn];
      const lot = __BAG__.LOTS[state.selected];
      const muzzle = __BAG__.muzzleFor(cart);
      const vel = __BAG__.velocityFor(cart, lot, state.aimAngle, state.aimPower, state.aimCut);

      const rubberBandPts = [
        new THREE.Vector3(muzzle.x, -muzzle.y, muzzle.z || 0),
        new THREE.Vector3(muzzle.x + Math.cos(state.aimAngle*Math.PI/180) * 100 * cart.facing, -muzzle.y + Math.sin(state.aimAngle*Math.PI/180) * 100, (muzzle.z || 0) + state.aimCut*20)
      ];
      rubberBandLine.geometry.setFromPoints(rubberBandPts);

      const wind = (state.windSeed / 4294967296) * 30 - 15;
      const FIXED = 1/120;
      let px = muzzle.x, py = muzzle.y, pz = muzzle.z || 0;
      let vx = vel.x, vy = vel.y, vz = vel.z;

      const maxDots = (lot.id === "cluster") ? 10 : 14; // roughly fade before target

      let time = 0;
      let dotIdx = 0;
      while (dotIdx < 16 && py < 1000) {
        time += FIXED;
        vx += wind * FIXED;
        vy += 620 * lot.gravity * FIXED;
        px += vx * FIXED;
        py += vy * FIXED;
        pz += vz * FIXED;

        if (time > (dotIdx + 1) * 0.08) {
          const m = dotMeshes[dotIdx];
          m.position.set(px, -py, pz);
          m.visible = dotIdx < maxDots;
          m.material.opacity = 0.95 - (dotIdx / maxDots) * 0.62;
          dotIdx++;
        }
      }
      for (; dotIdx < 16; dotIdx++) dotMeshes[dotIdx].visible = false;

    } else {
      aimPreviewGroup.visible = false;
    }

    playerCartMesh.position.set(carts.player.x, -__BAG__.groundAt(carts.player.x, carts.player.z), carts.player.z || 0);
    enemyCartMesh.position.set(carts.enemy.x, -__BAG__.groundAt(carts.enemy.x, carts.enemy.z), carts.enemy.z || 0);
    updatePipCrew(state);

    // Animate carts
    for (const [shooter, mesh, model, isSide] of [
      ["player", playerCartMesh, playerCartModel, true],
      ["enemy", enemyCartMesh, enemyCartModel, false]
    ]) {
      if (!model) continue;
      const isFiring = state.phase === "ceremony" && state.ceremony.shooterId === shooter;
      const isAiming = shooter === "player" && state.phase === "aim" && state.turn === "player" && __BAG__.gestureState?.valid;
      const flightAge = state.projectiles[0]?.age ?? Infinity;
      const justFired = state.phase === "flight" && state.volley?.shooterId === shooter && flightAge < 0.32;

      const cx = __BAG__.carts[shooter].x;
      const cy = -__BAG__.groundAt(cx, 0);

      let bx = cx, by = cy;

      if (isFiring) {
        const prog = Math.min(1, state.ceremony.elapsed / state.ceremony.duration);
        const load = prog * prog * (3 - 2 * prog);
        if (isSide) { // Sidewinder
          model.drums[0].rotation.z += 0.18 + load * 0.72;
          model.drums[1].rotation.z -= 0.18 + load * 0.72;
          model.suspension.position.y = -Math.sin(load * Math.PI) * 5;
          model.drums[0].position.y = -25 + load * 4;
          model.drums[1].position.y = 25 - load * 4;
          model.beltGrapes.forEach((grape, index) => { grape.position.x = grape.userData.baseX + ((state.elapsed * (18 + load * 38) + index * 4) % 17); });
          model.mast.rotation.z = -load * 0.035;
        } else { // Bootlegger
          for (const foot of model.feet) foot.position.y = foot.userData.baseY - load * 19;
          model.suspension.position.y = -Math.sin(load * Math.PI) * 3;
          model.pivot.rotation.z = -load * 0.46;
          model.piston.scale.y = 1 + load * 0.42;
          model.cup.position.x = 22 - load * 13;
          model.accumulator.scale.y = 1 + Math.sin(load * Math.PI * 8) * 0.035;
        }
      } else if (justFired) {
        const prog = flightAge / 0.32;
        const kick = Math.sin((1 - prog) * Math.PI * 0.5);
        bx = cx + (isSide ? -1 : 1) * 18 * kick;
        by = cy - 7 * kick;
        model.suspension.rotation.z = (isSide ? -1 : 1) * 0.045 * kick;
        if (isSide) {
          model.drums[0].rotation.z += 0.9 * (1 - prog);
          model.drums[1].rotation.z -= 0.9 * (1 - prog);
        } else {
          model.pivot.rotation.z = 0.25 * (1 - prog);
          model.cup.position.x = 34;
        }
      } else if (isAiming && isSide) {
        const charge = Math.max(0, Math.min(1, state.aimPower / 100));
        const tension = Math.sin(state.elapsed * (7 + charge * 15));
        model.drums[0].rotation.z += 0.08 + charge * 0.38;
        model.drums[1].rotation.z -= 0.08 + charge * 0.38;
        model.drums[0].position.y = -25 + charge * 3;
        model.drums[1].position.y = 25 - charge * 3;
        model.suspension.position.y = charge * 3 + tension * 0.7;
        model.suspension.rotation.z = -charge * 0.018;
        model.mast.rotation.z = -charge * 0.026;
        model.beltGrapes.forEach((grape, index) => {
          grape.position.x = grape.userData.baseX + ((state.elapsed * (10 + charge * 28) + index * 4) % 17);
        });
      } else {
        // Idle
        by = cy + Math.sin(state.elapsed * 2.5) * 1;
        model.suspension.position.y = 0;
        model.suspension.rotation.z = 0;
        if (isSide) {
          model.drums[0].position.y = -25;
          model.drums[1].position.y = 25;
          model.mast.rotation.z = 0;
        } else {
          for (const foot of model.feet) foot.position.y = foot.userData.baseY;
          model.pivot.rotation.z = 0;
          model.piston.scale.y = 1;
          model.cup.position.x = 22;
          model.accumulator.scale.y = 1;
        }
      }
      mesh.position.set(bx, by, 0);
    }

    const windValue = (state.windSeed / 4294967296) * 30 - 15;
    const windmillRotor = environment.userData.windmill?.userData.rotor;
    if (windmillRotor) windmillRotor.rotation.z += 0.0018 + Math.abs(windValue) * 0.00022;
    if (playerCartModel?.grabHalo) {
      const pulse = 1 + Math.sin(state.elapsed * 4.5) * 0.1;
      playerCartModel.grabHalo.scale.setScalar(pulse);
      playerCartModel.grabHalo.material.opacity = 0.5 + Math.sin(state.elapsed * 4.5) * 0.18;
      playerCartModel.grabHalo.visible = state.mode === "match" && state.phase === "aim" && state.turn === "player";
    }

    __BAG__.getGrabRect = function(shooterId) {
      if (!renderer || !camera) return null;
      scene.updateMatrixWorld(true);
      const anchor = shooterId === "player" ? playerCartModel?.grab : enemyCartModel?.cup;
      if (!anchor) return null;
      const pos = new THREE.Vector3();
      anchor.getWorldPosition(pos);
      pos.project(camera);
      const w = canvas2d.clientWidth;
      const h = canvas2d.clientHeight;
      const cx = (pos.x + 1) / 2 * w;
      const cy = (-pos.y + 1) / 2 * h;
      const size = 64;
      return { left: cx - size / 2, right: cx + size / 2, top: cy - size / 2, bottom: cy + size / 2, width: size, height: size };
    };

    const currentProjs = new Set();
    state.projectiles.forEach(p => {
      currentProjs.add(p);
      if (!projectileMeshes.has(p)) {
        const mesh = buildProjectileMesh(p);
        scene.add(mesh);
        projectileMeshes.set(p, mesh);
      }
      const mesh = projectileMeshes.get(p);
      mesh.position.set(p.x, -p.y, p.z || 0);
      mesh.rotation.z = -p.rotation;
      if (p.lotId !== "lug" && !(p.lotId === "cluster" && !p.child)) {
        const speed = Math.hypot(p.vx, p.vy);
        const stretch = Math.min(0.34, speed / 2600);
        mesh.scale.set(p.radius * (1 + stretch), p.radius * (1 - stretch * 0.5), p.radius * (1 - stretch * 0.35));
      }
    });

    for (let [p, mesh] of projectileMeshes.entries()) {
      if (!currentProjs.has(p)) {
        scene.remove(mesh);
        projectileMeshes.delete(p);
      }
    }

    const currentParts = new Set();
    state.particles.forEach(p => {
      currentParts.add(p);
      if (!particleMeshes.has(p)) {
        const mat = new THREE.MeshBasicMaterial({
          color: p.color,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          fog: false
        });
        const mesh = new THREE.Mesh(particleGeo, mat);
        mesh.renderOrder = 6;
        scene.add(mesh);
        particleMeshes.set(p, mesh);
      }
      const mesh = particleMeshes.get(p);
      mesh.position.set(p.x, -p.y, p.z || 0);
      const aspect = p.shape === "spark"
        ? [0.34, 1.9]
        : p.shape === "drop"
          ? [0.62, 1.5]
          : p.shape === "shard"
            ? [1.65, 0.58]
            : p.shape === "clod"
              ? [1.28, 1]
              : [1, 1];
      mesh.scale.set(p.size * 2 * aspect[0], p.size * 2 * aspect[1], 1);
      mesh.material.opacity = Math.max(0, p.life / p.maxLife);
      mesh.quaternion.copy(camera.quaternion);
      mesh.rotateZ(p.rotation || 0);
    });

    for (let [p, mesh] of particleMeshes.entries()) {
      if (!currentParts.has(p)) {
        scene.remove(mesh);
        mesh.material.dispose();
        particleMeshes.delete(p);
      }
    }

    const currentStains = new Set();
    state.stains.forEach((stain) => {
      currentStains.add(stain);
      if (!stainMeshes.has(stain)) {
        const material = new THREE.MeshBasicMaterial({
          map: splatTexture,
          color: stain.lotId === "pea" ? "#f3e6c8" : "#5a1638",
          transparent: true,
          opacity: 0.78,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        });
        const mesh = new THREE.Mesh(particleGeo, material);
        mesh.renderOrder = 3;
        scene.add(mesh);
        stainMeshes.set(stain, mesh);
      }
      const mesh = stainMeshes.get(stain);
      mesh.position.set(stain.x, -stain.y - 1, 24);
      mesh.scale.set(stain.rx * 2.6, stain.ry * 3.4, 1);
      mesh.rotation.z = -stain.rotation;
    });
    for (const [stain, mesh] of stainMeshes.entries()) {
      if (!currentStains.has(stain)) {
        scene.remove(mesh);
        mesh.material.dispose();
        stainMeshes.delete(stain);
      }
    }

    const currentRings = new Set();
    state.rings.forEach((ring) => {
      currentRings.add(ring);
      if (!ringMeshes.has(ring)) {
        const material = new THREE.MeshBasicMaterial({ color: ring.color, transparent: true, depthWrite: false, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.RingGeometry(0.76, 1, 30), material);
        mesh.renderOrder = 7;
        scene.add(mesh);
        ringMeshes.set(ring, mesh);
      }
      const mesh = ringMeshes.get(ring);
      mesh.position.set(ring.x, -ring.y, 32);
      mesh.scale.setScalar(ring.radius);
      mesh.material.opacity = Math.max(0, ring.life / ring.maxLife) * 0.82;
      mesh.quaternion.copy(camera.quaternion);
    });
    for (const [ring, mesh] of ringMeshes.entries()) {
      if (!currentRings.has(ring)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        ringMeshes.delete(ring);
      }
    }

    if (state.rutGhost && state.rutGhost !== lastGhostId) {
      if (ghostLine) scene.remove(ghostLine);
      const points = state.rutGhost.trail.map(pt => new THREE.Vector3(pt.x, -pt.y, pt.z || 0));
      points.push(new THREE.Vector3(state.rutGhost.impactX, -state.rutGhost.impactY, state.rutGhost.z || 0));
      const ghostGeo = new THREE.BufferGeometry().setFromPoints(points);
      ghostLine = new THREE.Line(ghostGeo, ghostMaterial);
      scene.add(ghostLine);
      lastGhostId = state.rutGhost;
    } else if (!state.rutGhost && ghostLine) {
      scene.remove(ghostLine);
      ghostLine = null;
      lastGhostId = null;
    }

    let camTargetX = __BAG__.W / 2;
    let camTargetY = -__BAG__.H / 2 + 70;
    let camTargetZ = 900;
    let lookTarget = new THREE.Vector3(__BAG__.W / 2, -__BAG__.H / 2 + 18, 0);

    if (state.impactFocus?.life > 0) {
      const focus = state.impactFocus;
      camTargetX = focus.x;
      camTargetY = -focus.y + 85;
      camTargetZ = focus.tier === "DEAD_LANE" ? 470 : focus.tier === "GRAZE" ? 610 : 760;
      lookTarget.set(focus.x, -focus.y, focus.z || 0);
    } else if (state.phase === "flight" && state.projectiles.length > 0) {
      const mainP = state.projectiles[0];
      camTargetX = mainP.x;
      camTargetY = -mainP.y + 100;
      camTargetZ = 600;
      lookTarget.set(mainP.x, -mainP.y, mainP.z || 0);
    } else if (state.phase === "ceremony" && state.ceremony) {
      const ceremonyCart = carts[state.ceremony.shooterId];
      const focusDirection = ceremonyCart.facing * 55;
      camTargetX = ceremonyCart.x + focusDirection;
      camTargetY = -__BAG__.groundAt(ceremonyCart.x) + 122;
      camTargetZ = 530;
      lookTarget.set(ceremonyCart.x + focusDirection, -__BAG__.groundAt(ceremonyCart.x) + 58, 10);
    } else if (state.phase === "aim" && state.turn === "player") {
      camTargetX = __BAG__.W / 2;
      camTargetY = -__BAG__.H / 2 + 76;
      camTargetZ = 900;
      lookTarget.set(__BAG__.W / 2, -__BAG__.H / 2 + 18, 0);
    } else if (state.turn === "enemy") {
      camTargetX = carts.enemy.x;
      camTargetY = -__BAG__.groundAt(carts.enemy.x) + 200;
      lookTarget.set(carts.enemy.x - 200, -__BAG__.groundAt(carts.enemy.x), 0);
    }

    const cameraEase = state.phase === "ceremony" ? 0.1 : 0.05;
    camera.position.x += (camTargetX - camera.position.x) * cameraEase;
    camera.position.y += (camTargetY - camera.position.y) * cameraEase;
    camera.position.z += (camTargetZ - camera.position.z) * cameraEase;

    if (state.cameraPunchZ) {
      camera.position.z += state.cameraPunchZ;
      state.cameraPunchZ = 0;
    }
    if (state.cameraPunchX) {
      camera.position.x += state.cameraPunchX;
      state.cameraPunchX = 0;
    }

    if (state.shake > 0) {
      camera.position.x += (Math.random() - 0.5) * state.shake * 0.5;
      camera.position.y += (Math.random() - 0.5) * state.shake * 0.5;
    }

    camera.lookAt(lookTarget);

    renderer.render(scene, camera);
  };

  __BAG__.rendererInfo = function() {
    return {
      mode: "procedural-3d",
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines,
      playerParts: playerCartModel?.group.children.length || 0,
      enemyParts: enemyCartModel?.group.children.length || 0,
      pipCount: crewMeshes.player.length + crewMeshes.enemy.length
    };
  };

})();
