import * as THREE from "./vendor/three/three.module.min.js";
import { EffectComposer } from "./vendor/three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "./vendor/three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "./vendor/three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "./vendor/three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "./vendor/three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "./vendor/three/addons/geometries/RoundedBoxGeometry.js";

(() => {
  "use strict";

  const { __BAG__ } = window;
  const container = document.getElementById("stage");
  const canvas2d = document.getElementById("c");

  let renderer;
  let composer = null;
  let postEnabled = false;
  let activePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  let lastRenderStats = { calls: 0, triangles: 0, points: 0, lines: 0 };
  try {
    const evidenceCapture = new URLSearchParams(window.location.search).has("evidence");
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: evidenceCapture
    });
    renderer.setPixelRatio(activePixelRatio);
    renderer.setSize(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight), false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.info.autoReset = false;
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
  const paintCloud = (x, y, width, alpha) => {
    skyCtx.fillStyle = `rgba(243,230,200,${alpha})`;
    skyCtx.beginPath();
    skyCtx.ellipse(x, y, width * 0.24, width * 0.055, -0.08, 0, Math.PI * 2);
    skyCtx.ellipse(x + width * 0.2, y - 4, width * 0.31, width * 0.075, 0.04, 0, Math.PI * 2);
    skyCtx.ellipse(x - width * 0.22, y + 3, width * 0.19, width * 0.05, 0.12, 0, Math.PI * 2);
    skyCtx.fill();
  };
  paintCloud(92, 72, 110, 0.15);
  paintCloud(356, 54, 135, 0.17);
  paintCloud(460, 104, 74, 0.11);
  skyCtx.fillStyle = "rgba(90,22,56,0.08)";
  skyCtx.fillRect(0, 179, 512, 2);
  skyCtx.fillStyle = "rgba(243,230,200,0.11)";
  skyCtx.fillRect(0, 183, 512, 1);
  const skyTex = new THREE.CanvasTexture(skyCanvas);

  const scene = new THREE.Scene();
  scene.background = skyTex;
  scene.fog = new THREE.FogExp2("#d8c6a4", 0.00018);
  scene.backgroundIntensity = 0.84;
  scene.environmentIntensity = 0.56;

  const camera = new THREE.PerspectiveCamera(39, Math.max(1, container.clientWidth) / Math.max(1, container.clientHeight), 1, 3000);
  const fullFieldCameraZ = () => 900 * Math.max(1, (16 / 9) / Math.max(0.8, camera.aspect));
  camera.position.set(__BAG__.W / 2, -260, fullFieldCameraZ() + 25);

  try {
    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const environmentScene = new RoomEnvironment();
    scene.environment = environmentGenerator.fromScene(environmentScene, 0.035).texture;
    environmentScene.dispose();
    environmentGenerator.dispose();
  } catch (error) {
    console.warn("Environment lighting unavailable; continuing with field lights.", error);
  }

  const hemiLight = new THREE.HemisphereLight("#fff8df", "#563421", 0.72);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight("#fff1c9", 1.06);
  dirLight.position.set(__BAG__.W / 2 - 850, 720, 640);
  dirLight.castShadow = true;
  dirLight.target.position.set(__BAG__.W / 2, -__BAG__.H / 2, 0);
  dirLight.shadow.camera.left = -760;
  dirLight.shadow.camera.right = 760;
  dirLight.shadow.camera.top = 470;
  dirLight.shadow.camera.bottom = -470;
  dirLight.shadow.camera.near = 100;
  dirLight.shadow.camera.far = 2300;
  dirLight.shadow.mapSize.width = 1536;
  dirLight.shadow.mapSize.height = 1536;
  dirLight.shadow.bias = -0.0004;
  dirLight.shadow.normalBias = 0.035;
  scene.add(dirLight);
  scene.add(dirLight.target);

  const rimLight = new THREE.DirectionalLight("#d9a8b8", 0.3);
  rimLight.position.set(__BAG__.W + 220, 260, 520);
  scene.add(rimLight);

  const impactLight = new THREE.PointLight("#f3e6c8", 0, 280, 1.7);
  scene.add(impactLight);

  const renderPass = new RenderPass(scene, camera);
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(Math.max(1, container.clientWidth), Math.max(1, container.clientHeight)),
    0.18,
    0.26,
    1.08
  );
  const outputPass = new OutputPass();

  try {
    const constrainedDevice = Number(navigator.deviceMemory || 4) <= 2;
    if (!constrainedDevice) {
      composer = new EffectComposer(renderer);
      composer.addPass(renderPass);
      composer.addPass(bloomPass);
      composer.addPass(outputPass);
      postEnabled = true;
    }
  } catch (error) {
    composer = null;
    postEnabled = false;
    console.warn("Post-processing unavailable; continuing with direct rendering.", error);
  }

  function syncRendererSize() {
    const width = Math.max(1, Math.round(container.clientWidth));
    const height = Math.max(1, Math.round(container.clientHeight));
    renderer.setPixelRatio(activePixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (composer) {
      composer.setPixelRatio(activePixelRatio);
      composer.setSize(width, height);
    }
  }

  syncRendererSize();
  const resizeObserver = new ResizeObserver(syncRendererSize);
  resizeObserver.observe(container);
  window.visualViewport?.addEventListener("resize", syncRendererSize, { passive: true });

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
    steel: new THREE.MeshStandardMaterial({ color: "#30383a", roughness: 0.47, metalness: 0.8, flatShading: true }),
    steelLight: new THREE.MeshStandardMaterial({ color: "#8b9495", roughness: 0.34, metalness: 0.84, flatShading: true }),
    rubber: new THREE.MeshStandardMaterial({ color: "#15191a", roughness: 0.92, metalness: 0.04, flatShading: true }),
    oxblood: new THREE.MeshPhysicalMaterial({ color: "#6b1c2a", roughness: 0.38, metalness: 0.25, clearcoat: 0.28, clearcoatRoughness: 0.54, flatShading: true }),
    oxbloodDark: new THREE.MeshStandardMaterial({ color: "#32111b", roughness: 0.56, metalness: 0.22, flatShading: true }),
    olive: new THREE.MeshPhysicalMaterial({ color: "#31543f", roughness: 0.44, metalness: 0.28, clearcoat: 0.22, clearcoatRoughness: 0.6, flatShading: true }),
    oliveDark: new THREE.MeshStandardMaterial({ color: "#142a22", roughness: 0.64, metalness: 0.24, flatShading: true }),
    copper: new THREE.MeshStandardMaterial({ color: "#a85d3d", roughness: 0.44, metalness: 0.75, flatShading: true }),
    grape: new THREE.MeshPhysicalMaterial({ color: "#5a1638", roughness: 0.24, metalness: 0.03, clearcoat: 0.62, clearcoatRoughness: 0.28, sheen: 0.24, sheenColor: "#f3e6c8", flatShading: true }),
    grapeDark: new THREE.MeshStandardMaterial({ color: "#301326", roughness: 0.5, metalness: 0.05, flatShading: true }),
    cyan: new THREE.MeshStandardMaterial({ color: "#f3e6c8", emissive: "#5a1638", emissiveIntensity: 1.35, roughness: 0.25, metalness: 0.18 }),
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

  const sidewinderLabel = makeMachineLabel("YARD 12", "TWIN-FLYWHEEL", "#f3e6c8");
  const bootleggerLabel = makeMachineLabel("LATE 09", "PRESSURE-LARIAT", "#c57a55");

  function addMesh(parent, geometry, material, position, rotation = null, scale = null, outline = false) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(position[0], position[1], position[2]);
    if (rotation) item.rotation.set(rotation[0], rotation[1], rotation[2]);
    if (scale) item.scale.set(scale[0], scale[1], scale[2]);
    geometry.computeBoundingBox();
    const outlineSize = new THREE.Vector3();
    geometry.boundingBox?.getSize(outlineSize);
    item.castShadow = outline || Math.max(outlineSize.x, outlineSize.y, outlineSize.z) >= 26;
    item.receiveShadow = true;
    parent.add(item);
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

  function roundedBox(width, height, depth, radius = 4) {
    return new RoundedBoxGeometry(width, height, depth, 3, Math.min(radius, width / 2, height / 2, depth / 2));
  }

  function addHose(parent, points, material, radius = 1.5) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(point[0], point[1], point[2])));
    return addMesh(parent, new THREE.TubeGeometry(curve, 14, radius, 6, false), material, [0, 0, 0]);
  }

  function addBoltStrip(parent, points, material = MAT.copper) {
    const geometry = new THREE.SphereGeometry(1.65, 6, 4);
    const bolts = new THREE.InstancedMesh(geometry, material, points.length);
    const matrix = new THREE.Matrix4();
    points.forEach((point, index) => {
      matrix.makeTranslation(point[0], point[1], point[2]);
      bolts.setMatrixAt(index, matrix);
    });
    bolts.instanceMatrix.needsUpdate = true;
    parent.add(bolts);
    return bolts;
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
    elevator.position.set(890, -__BAG__.groundAt(890, -470), -470);
    elevator.scale.setScalar(0.47);
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
    windmill.position.set(150, -__BAG__.groundAt(150, -430), -430);
    windmill.scale.setScalar(0.48);
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
    pivot.visible = false;

    const turbineMaterial = new THREE.MeshStandardMaterial({ color: "#536065", roughness: 0.76, metalness: 0.34, flatShading: true });
    for (const [x, scale] of [[485, 0.54], [690, 0.43]]) {
      const turbine = new THREE.Group();
      addMesh(turbine, new THREE.CylinderGeometry(3, 7, 190, 7), turbineMaterial, [0, 95, 0]);
      const turbineRotor = new THREE.Group();
      for (let bladeIndex = 0; bladeIndex < 3; bladeIndex += 1) {
        const blade = addMesh(turbineRotor, roundedBox(8, 82, 3, 2), turbineMaterial, [0, 39, 0]);
        blade.rotation.z = bladeIndex / 3 * Math.PI * 2;
      }
      addMesh(turbineRotor, new THREE.CylinderGeometry(8, 8, 8, 10), MAT.copper, [0, 0, 3], [Math.PI / 2, 0, 0]);
      turbineRotor.position.y = 190;
      turbine.add(turbineRotor);
      turbine.userData.rotor = turbineRotor;
      turbine.position.set(x, -__BAG__.groundAt(x, -500), -500);
      turbine.scale.setScalar(scale);
      environment.add(turbine);
      if (!environment.userData.turbines) environment.userData.turbines = [];
      environment.userData.turbines.push(turbine);
    }

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

    addMesh(suspension, roundedBox(190, 18, 62, 5), MAT.steel, [0, 34, 0], null, null, true);
    addMesh(suspension, roundedBox(172, 30, 58, 7), MAT.oxbloodDark, [-6, 54, 0], [0, 0, -0.02], null, true);
    const cowling = addMesh(suspension, roundedBox(108, 34, 66, 10), MAT.oxblood, [-28, 76, 0], [0, 0, -0.12], null, true);
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
    const drumSignals = [];
    for (const y of [-25, 25]) {
      const drum = addMesh(accelerator, drumGeometry, MAT.rubber, [0, y, 0], null, null, true);
      addMesh(drum, new THREE.TorusGeometry(18, 3.2, 8, 18), MAT.copper, [0, 0, 9]);
      const signalRing = addMesh(drum, new THREE.TorusGeometry(13.5, 1.35, 7, 20), MAT.cyan, [0, 0, 10.6]);
      addMesh(drum, new THREE.CylinderGeometry(7, 7, 23, 10), MAT.grape, [0, 0, 0], [Math.PI / 2, 0, 0]);
      drums.push(drum);
      drumSignals.push(signalRing);
    }
    addMesh(accelerator, roundedBox(32, 92, 48, 6), MAT.steel, [0, 0, -4], null, null, true);
    drums.forEach((drum) => accelerator.add(drum));

    const belt = new THREE.Group();
    belt.position.set(5, 111, 0);
    belt.rotation.z = -0.28;
    suspension.add(belt);
    addMesh(belt, roundedBox(92, 7, 26, 3), MAT.rubber, [0, 0, 0], null, null, true);
    const beltGrapes = [];
    for (let i = -2; i <= 2; i += 1) {
      const grape = addMesh(belt, new THREE.SphereGeometry(6, 10, 8), MAT.grape, [i * 17, 8, 0]);
      grape.userData.baseX = grape.position.x;
      beltGrapes.push(grape);
    }

    const launchChute = new THREE.Group();
    launchChute.position.set(63, 92, 0);
    launchChute.rotation.z = 0.08;
    suspension.add(launchChute);
    addMesh(launchChute, roundedBox(80, 5, 6, 2), MAT.steelLight, [19, -11, 23], null, null, true);
    addMesh(launchChute, roundedBox(80, 5, 6, 2), MAT.steelLight, [19, 11, 23], null, null, true);
    addMesh(launchChute, roundedBox(10, 38, 34, 4), MAT.oxbloodDark, [56, 0, 7], null, null, true);
    addMesh(launchChute, new THREE.TorusGeometry(15, 2.4, 8, 20), MAT.copper, [57, 0, 25]);
    const chamberGrape = addMesh(launchChute, new THREE.SphereGeometry(7.5, 12, 9), MAT.grape, [21, 0, 24]);
    chamberGrape.userData.baseX = chamberGrape.position.x;

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
    addHose(suspension, [[-43, 88, 35], [-12, 94, 42], [26, 86, 42], [61, 77, 34]], MAT.grapeDark, 1.7);
    addHose(suspension, [[-37, 81, 36], [-5, 84, 45], [32, 76, 44], [75, 71, 32]], MAT.copper, 1.1);
    addBoltStrip(suspension, [[-76, 54, 31], [-52, 55, 31], [-28, 55, 31], [-4, 55, 31], [20, 54, 31], [43, 52, 31]]);

    const grab = addMesh(suspension, new THREE.TorusGeometry(15, 3, 8, 18, Math.PI), MAT.copper, [94, 84, 0], [0, Math.PI / 2, Math.PI / 2]);
    grab.userData.isGrab = true;
    const haloMaterial = MAT.cyan.clone();
    haloMaterial.transparent = true;
    haloMaterial.opacity = 0.72;
    const grabHalo = addMesh(suspension, new THREE.TorusGeometry(22, 2.2, 8, 24), haloMaterial, [94, 84, 39]);
    group.scale.setScalar(1.08);
    return { group, suspension, cowling, hopper, accelerator, drums, drumSignals, belt, beltGrapes, launchChute, chamberGrape, tank, mast, wheels, grab, grabHalo };
  }

  function buildBootlegger() {
    const group = new THREE.Group();
    const suspension = new THREE.Group();
    group.add(suspension);
    addMesh(suspension, roundedBox(172, 18, 62, 5), MAT.steel, [0, 42, 0], null, null, true);
    addMesh(suspension, roundedBox(150, 22, 57, 6), MAT.oliveDark, [-2, 61, 0], null, null, true);

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
    addMesh(suspension, roundedBox(52, 18, 68, 7), MAT.olive, [53, 74, 0], [0, 0, 0.04], null, true);
    addMesh(suspension, roundedBox(34, 8, 72, 3), MAT.steelLight, [66, 51, 0], [0, 0, 0.08], null, true);

    const pressureTank = addMesh(suspension, new THREE.CylinderGeometry(18, 18, 104, 16), MAT.steelLight, [-4, 73, -24], [0, 0, Math.PI / 2], null, true);
    for (const x of [-38, 0, 38]) addMesh(suspension, new THREE.TorusGeometry(19, 2.8, 8, 14), MAT.copper, [x - 4, 73, -24], [0, Math.PI / 2, 0]);
    const accumulator = addMesh(suspension, new THREE.CylinderGeometry(10, 10, 42, 12), MAT.glassPurple, [-57, 88, 26], null, null, true);

    const gauge = addMesh(suspension, new THREE.CylinderGeometry(13, 13, 6, 18), MAT.ink, [29, 94, 36], [Math.PI / 2, 0, 0]);
    addMesh(gauge, new THREE.TorusGeometry(9, 1.7, 7, 20), MAT.cyan, [0, 3.2, 0], [Math.PI / 2, 0, 0]);
    addHose(suspension, [[-45, 83, 34], [-23, 99, 43], [7, 106, 43], [31, 101, 36]], MAT.grapeDark, 1.8);
    addHose(suspension, [[-35, 72, 36], [-4, 69, 45], [22, 78, 44], [48, 89, 34]], MAT.copper, 1.1);
    addBoltStrip(suspension, [[-60, 62, 31], [-37, 62, 31], [-14, 62, 31], [9, 62, 31], [32, 63, 31], [55, 65, 31]]);

    const pivot = new THREE.Group();
    pivot.position.set(24, 116, 0);
    suspension.add(pivot);
    const boom = addMesh(pivot, roundedBox(90, 20, 25, 6), MAT.steel, [36, 17, 0], [0, 0, 0.27], null, true);
    addMesh(boom, roundedBox(60, 5, 29, 2), MAT.copper, [1, 0, 0]);
    addMesh(boom, roundedBox(46, 4, 31, 2), MAT.cyan, [2, 3, 0]);
    const piston = addMesh(pivot, new THREE.CylinderGeometry(6, 9, 63, 10), MAT.steelLight, [10, 11, -17], [0, 0, -1.04]);
    const yoke = new THREE.Group();
    yoke.position.set(78, 35, 0);
    pivot.add(yoke);
    addMesh(yoke, roundedBox(12, 46, 14, 3), MAT.oliveDark, [0, 15, 17], [0, 0, -0.13], null, true);
    addMesh(yoke, roundedBox(12, 46, 14, 3), MAT.oliveDark, [0, 15, -17], [0, 0, -0.13], null, true);
    addMesh(yoke, new THREE.TorusGeometry(18, 5, 8, 18, Math.PI), MAT.copper, [0, 39, 0], [Math.PI / 2, 0, 0]);
    const cup = addMesh(yoke, new THREE.SphereGeometry(13, 12, 10), MAT.grape, [16, 4, 0]);
    cup.userData.baseX = cup.position.x;

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
  const rubberBandMat = new THREE.LineBasicMaterial({ color: "#6b1c2a", linewidth: 3, transparent: true, opacity: 0.96, depthTest: false });
  const rubberBandLine = new THREE.Line(rubberBandGeo, rubberBandMat);
  rubberBandLine.renderOrder = 10;
  aimPreviewGroup.add(rubberBandLine);
  const dragKnob = new THREE.Mesh(
    new THREE.RingGeometry(10, 14, 28),
    new THREE.MeshBasicMaterial({ color: "#f3e6c8", transparent: true, opacity: 0.92, depthTest: false, side: THREE.DoubleSide })
  );
  dragKnob.renderOrder = 11;
  aimPreviewGroup.add(dragKnob);
  const dragRaycaster = new THREE.Raycaster();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -42);
  const dragNdc = new THREE.Vector2();
  const dragWorld = new THREE.Vector3();
  const dotMeshes = [];
  const dotGeo = new THREE.SphereGeometry(3.6, 7, 6);
  const dotMat = new THREE.MeshBasicMaterial({ color: "#741957", transparent: true });
  for (let i = 0; i < 16; i++) {
    const dot = new THREE.Mesh(dotGeo, dotMat.clone());
    dotMeshes.push(dot);
    aimPreviewGroup.add(dot);
  }

  const impactFx = new THREE.Group();
  impactFx.visible = false;
  scene.add(impactFx);
  const impactCore = new THREE.Mesh(
    new THREE.CircleGeometry(1, 30),
    new THREE.MeshBasicMaterial({
      color: "#f3e6c8",
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  impactCore.renderOrder = 15;
  impactFx.add(impactCore);
  const makeImpactHalo = (color, inner, outer, order) => {
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 42),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      })
    );
    halo.renderOrder = order;
    impactFx.add(halo);
    return halo;
  };
  const impactHalo = makeImpactHalo("#f3e6c8", 0.8, 1, 14);
  const impactJuiceHalo = makeImpactHalo("#6b1c2a", 0.62, 1, 13);
  impactJuiceHalo.material.blending = THREE.NormalBlending;

  let qualityWindowStarted = performance.now();
  let qualityFrameCount = 0;
  let rendererReadyReported = false;

  function monitorRenderQuality(now) {
    qualityFrameCount += 1;
    const elapsed = now - qualityWindowStarted;
    if (elapsed < 1800 || qualityFrameCount < 45) return;

    const framesPerSecond = qualityFrameCount * 1000 / elapsed;
    let qualityChanged = false;
    if (framesPerSecond < 43 && activePixelRatio > 1.7) {
      activePixelRatio = Math.min(window.devicePixelRatio || 1, 1.65);
      qualityChanged = true;
    } else if (framesPerSecond < 39 && activePixelRatio > 1.4) {
      activePixelRatio = Math.min(window.devicePixelRatio || 1, 1.35);
      qualityChanged = true;
    } else if (framesPerSecond < 34 && postEnabled) {
      postEnabled = false;
    }

    if (qualityChanged) syncRendererSize();
    qualityWindowStarted = now;
    qualityFrameCount = 0;
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

    playerCartMesh.position.set(carts.player.x, -__BAG__.groundAt(carts.player.x, carts.player.z), carts.player.z || 0);
    enemyCartMesh.position.set(carts.enemy.x, -__BAG__.groundAt(carts.enemy.x, carts.enemy.z), carts.enemy.z || 0);
    scene.updateMatrixWorld(true);

    if (__BAG__.gestureState && __BAG__.gestureState.valid && state.phase === "aim") {
      aimPreviewGroup.visible = true;
      const cart = carts[state.turn];
      const lot = __BAG__.LOTS[state.selected];
      const muzzle = __BAG__.muzzleFor(cart);
      const vel = __BAG__.velocityFor(cart, lot, state.aimAngle, state.aimPower, state.aimCut);

      const canvasRect = renderer.domElement.getBoundingClientRect();
      dragNdc.set(
        (__BAG__.gestureState.current.x - canvasRect.left) / canvasRect.width * 2 - 1,
        -((__BAG__.gestureState.current.y - canvasRect.top) / canvasRect.height * 2 - 1)
      );
      dragRaycaster.setFromCamera(dragNdc, camera);
      dragRaycaster.ray.intersectPlane(dragPlane, dragWorld);
      const grabWorld = new THREE.Vector3();
      playerCartModel.grab.getWorldPosition(grabWorld);
      grabWorld.z = 42;
      dragWorld.z = 42;
      const rubberBandPts = [grabWorld, dragWorld.clone()];
      rubberBandLine.geometry.setFromPoints(rubberBandPts);
      dragKnob.position.copy(dragWorld);
      dragKnob.quaternion.copy(camera.quaternion);
      dragKnob.rotation.z += state.aimCut * 0.08;

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
          model.chamberGrape.position.x = model.chamberGrape.userData.baseX + load * 24;
          model.mast.rotation.z = -load * 0.035;
        } else { // Bootlegger
          for (const foot of model.feet) foot.position.y = foot.userData.baseY - load * 19;
          model.suspension.position.y = -Math.sin(load * Math.PI) * 3;
          model.pivot.rotation.z = -load * 0.46;
          model.piston.scale.y = 1 + load * 0.42;
          model.cup.position.x = model.cup.userData.baseX - load * 10;
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
          model.chamberGrape.position.x = model.chamberGrape.userData.baseX + 30 * (1 - prog);
        } else {
          model.pivot.rotation.z = 0.25 * (1 - prog);
          model.cup.position.x = model.cup.userData.baseX + 15 * (1 - prog);
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
        model.chamberGrape.position.x = model.chamberGrape.userData.baseX + charge * 18;
      } else {
        // Idle
        by = cy + Math.sin(state.elapsed * 2.5) * 1;
        model.suspension.position.y = 0;
        model.suspension.rotation.z = 0;
        if (isSide) {
          model.drums[0].position.y = -25;
          model.drums[1].position.y = 25;
          model.mast.rotation.z = 0;
          model.chamberGrape.position.x = model.chamberGrape.userData.baseX;
        } else {
          for (const foot of model.feet) foot.position.y = foot.userData.baseY;
          model.pivot.rotation.z = 0;
          model.piston.scale.y = 1;
          model.cup.position.x = model.cup.userData.baseX;
          model.accumulator.scale.y = 1;
        }
      }
      mesh.position.set(bx, by, 0);
    }

    const windValue = (state.windSeed / 4294967296) * 30 - 15;
    const windmillRotor = environment.userData.windmill?.userData.rotor;
    if (windmillRotor) windmillRotor.rotation.z += 0.0018 + Math.abs(windValue) * 0.00022;
    for (const turbine of environment.userData.turbines || []) {
      if (turbine.userData.rotor) turbine.userData.rotor.rotation.z += 0.0011 + Math.abs(windValue) * 0.00013;
    }
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

    if (state.impactFocus?.life > 0) {
      const focus = state.impactFocus;
      const remaining = Math.max(0, Math.min(1, focus.life / (focus.maxLife || 0.92)));
      const progress = 1 - remaining;
      const hitScale = focus.lotId === "lug" ? 1.34 : focus.lotId === "cluster" ? 1.12 : 1;
      const radius = Math.max(34, focus.radius || 52) * hitScale;
      const eased = 1 - Math.pow(1 - progress, 3);
      impactFx.visible = true;
      impactFx.position.set(focus.x, -focus.y, (focus.z || 0) + 44);
      impactFx.quaternion.copy(camera.quaternion);
      impactCore.scale.setScalar((14 + eased * 34) * hitScale);
      impactCore.material.opacity = Math.pow(remaining, 2.4) * 0.72;
      impactHalo.scale.setScalar(18 + eased * radius * 1.25);
      impactHalo.material.opacity = Math.sin(Math.min(1, progress * 1.8) * Math.PI) * 0.62;
      impactJuiceHalo.scale.setScalar(8 + eased * radius * 0.82);
      impactJuiceHalo.material.opacity = Math.pow(remaining, 1.4) * 0.72;
      impactJuiceHalo.rotation.z = progress * -0.42;
      impactLight.position.set(focus.x, -focus.y + 28, (focus.z || 0) + 80);
      impactLight.intensity = 3600 * Math.pow(remaining, 2) * hitScale;
    } else {
      impactFx.visible = false;
      impactLight.intensity = 0;
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
    let camTargetZ = fullFieldCameraZ();
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
      camTargetZ = fullFieldCameraZ();
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

    renderer.info.reset();
    // Input latency and text compositing matter more than bloom during the
    // one moment a thumb is actively shaping a shot.
    const directInteractionFrame = (state.phase === "aim" && __BAG__.gestureState?.valid) || state.impactFocus?.life > 0;
    if (composer && postEnabled && !directInteractionFrame) composer.render();
    else renderer.render(scene, camera);

    lastRenderStats = {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      points: renderer.info.render.points,
      lines: renderer.info.render.lines
    };
    monitorRenderQuality(performance.now());

    if (!rendererReadyReported) {
      rendererReadyReported = true;
      window.dispatchEvent(new CustomEvent("bag:renderer-ready"));
    }
  };

  __BAG__.rendererInfo = function() {
    return {
      mode: "procedural-3d",
      threeRevision: THREE.REVISION,
      calls: lastRenderStats.calls,
      triangles: lastRenderStats.triangles,
      points: lastRenderStats.points,
      lines: lastRenderStats.lines,
      pixelRatio: activePixelRatio,
      postEnabled,
      shadowMode: "PCFShadowMap",
      viewport: {
        width: renderer.domElement.width,
        height: renderer.domElement.height,
        cssWidth: renderer.domElement.clientWidth,
        cssHeight: renderer.domElement.clientHeight
      },
      playerParts: playerCartModel?.group.children.length || 0,
      enemyParts: enemyCartModel?.group.children.length || 0,
      pipCount: crewMeshes.player.length + crewMeshes.enemy.length
    };
  };

})();
