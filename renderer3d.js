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
    renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas2d.width, canvas2d.height);
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

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#5A1638");
  scene.fog = new THREE.FogExp2("#5A1638", 0.00045);

  const camera = new THREE.PerspectiveCamera(45, canvas2d.width / canvas2d.height, 1, 2500);
  camera.position.set(__BAG__.W / 2, -200, 800);
  
  const hemiLight = new THREE.HemisphereLight("#8AA7B8", "#1A100C", 0.8);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight("#F3E6C8", 0.6);
  dirLight.position.set(__BAG__.W / 2, -1000, 500);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -__BAG__.W;
  dirLight.shadow.camera.right = __BAG__.W;
  dirLight.shadow.camera.top = __BAG__.W;
  dirLight.shadow.camera.bottom = -__BAG__.W;
  dirLight.shadow.camera.near = 100;
  dirLight.shadow.camera.far = 2000;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

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
  const dirtMaterial = new THREE.MeshLambertMaterial({ map: groundTex });
  const juiceMaterial = new THREE.MeshLambertMaterial({ color: __BAG__.COLORS.juice });
  
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

  const projectileMeshes = new Map();
  const particleMeshes = new Map();
  const sphereGeo = new THREE.SphereGeometry(1, 8, 8);
  const particleGeo = new THREE.PlaneGeometry(1, 1);
  
  const playerCartMesh = new THREE.Group();
  const enemyCartMesh = new THREE.Group();
  const crewMeshes = { player: [], enemy: [] };
  scene.add(playerCartMesh);
  scene.add(enemyCartMesh);
  let identityInitialized = false;

  function imageReady(image) {
    return Boolean(image && image.complete && (image.naturalWidth || image.width) > 0);
  }

  function makePaintedPlane(image, worldWidth, flip = false) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const worldHeight = worldWidth * sourceHeight / sourceWidth;
    const texture = new THREE.CanvasTexture(image);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    if ("encoding" in texture && THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.08,
      depthWrite: false,
      fog: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldWidth, worldHeight), material);
    if (flip) mesh.scale.x = -1;
    mesh.position.y = worldHeight / 2 - 32;
    mesh.castShadow = true;
    mesh.renderOrder = 3;
    return mesh;
  }

  function addPipCrew(group, image, side) {
    const seed = makePaintedPlane(image, 55, side === "enemy");
    for (let index = 0; index < 5; index += 1) {
      const pip = index === 0 ? seed : seed.clone();
      pip.visible = false;
      pip.renderOrder = 4 + index * 0.01;
      pip.userData.restY = seed.position.y;
      pip.userData.baseScaleX = pip.scale.x;
      group.add(pip);
      crewMeshes[side].push(pip);
    }
  }

  function updatePipCrew(state) {
    state.crewPose = null;
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
        pip.scale.x = pip.userData.baseScaleX;
      };

      pips.forEach((pip) => {
        pip.visible = false;
        pip.rotation.z = 0;
      });

      if (!active) {
        pose(0, -facing * 168, Math.sin(state.elapsed * 2.1) * 1.5);
        continue;
      }

      state.crewPose = {
        side,
        lotId: state.ceremony.lotId,
        count: state.ceremony.lotId === "table" || state.ceremony.lotId === "pea" ? 3 : 5
      };

      const front = facing * 158;
      if (state.ceremony.lotId === "table") {
        pose(0, front - facing * 62, 2 + pulse * 2, 18, pulse * 0.035);
        pose(1, front - facing * 8, 10 + Math.abs(pulse) * 5, 22, -facing * 0.05);
        pose(2, front + facing * 55, 1, 16, facing * 0.04);
      } else if (state.ceremony.lotId === "pea") {
        pose(0, front - facing * 48, 1, 18, -facing * (0.04 + pulse * 0.03));
        pose(1, front + facing * 46, 1, 18, facing * (0.04 + pulse * 0.03));
        pose(2, front - facing * 96, 4 + Math.abs(pulse) * 8, 14, pulse * 0.1);
      } else if (state.ceremony.lotId === "cluster") {
        for (let index = 0; index < 5; index += 1) {
          const column = index % 2;
          const row = Math.floor(index / 2);
          pose(
            index,
            front + facing * (column ? 16 : -16),
            row * 38 + (column ? 7 : 0) + Math.abs(pulse) * 3,
            16 + index * 3,
            (index - 2) * 0.045
          );
        }
      } else {
        for (let index = 0; index < 4; index += 1) {
          pose(index, -facing * (105 + index * 43) + pulse * facing * 4, 1, 14 + index * 2, -facing * 0.11);
        }
        pose(4, front, 28 + Math.sin(progress * Math.PI) * 26, 24, facing * 0.07);
      }
    }
  }

  function initializeIdentity() {
    if (identityInitialized) return true;
    const { sky, yard, late, pip } = __BAG__.IMG;
    if (![yard, late, pip].every(imageReady)) return false;

    if (imageReady(sky)) {
      const skyTexture = new THREE.CanvasTexture(sky);
      skyTexture.minFilter = THREE.LinearFilter;
      if ("encoding" in skyTexture && THREE.sRGBEncoding) skyTexture.encoding = THREE.sRGBEncoding;
      scene.background = skyTexture;
    }

    const yardPlane = makePaintedPlane(yard, 270);
    playerCartMesh.add(yardPlane);
    addPipCrew(playerCartMesh, pip, "player");

    const latePlane = makePaintedPlane(late, 270);
    enemyCartMesh.add(latePlane);
    addPipCrew(enemyCartMesh, pip, "enemy");

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

  __BAG__.render3D = function() {
    const state = __BAG__.state;
    const carts = __BAG__.carts;

    initializeIdentity();
    
    updateTerrainCraters();
    
    playerCartMesh.position.set(carts.player.x, -__BAG__.groundAt(carts.player.x, carts.player.z) + 32, carts.player.z || 0);
    enemyCartMesh.position.set(carts.enemy.x, -__BAG__.groundAt(carts.enemy.x, carts.enemy.z) + 32, carts.enemy.z || 0);
    updatePipCrew(state);

    const currentProjs = new Set();
    state.projectiles.forEach(p => {
      currentProjs.add(p);
      if (!projectileMeshes.has(p)) {
        const mesh = new THREE.Mesh(sphereGeo, juiceMaterial);
        mesh.scale.set(p.radius, p.radius, p.radius);
        mesh.castShadow = true;
        scene.add(mesh);
        projectileMeshes.set(p, mesh);
      }
      const mesh = projectileMeshes.get(p);
      mesh.position.set(p.x, -p.y, p.z || 0);
      mesh.rotation.z = -p.rotation;
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
    let camTargetY = -__BAG__.H / 2;
    let camTargetZ = 800;
    let lookTarget = new THREE.Vector3(__BAG__.W / 2, -__BAG__.H / 2, 0);
    
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
    } else if (state.phase === "aim" && state.turn === "player") {
      camTargetX = __BAG__.W / 2;
      camTargetY = -__BAG__.H / 2 + 20;
      camTargetZ = 920;
      lookTarget.set(__BAG__.W / 2, -__BAG__.H / 2 - 65, 0);
    } else if (state.turn === "enemy") {
      camTargetX = carts.enemy.x;
      camTargetY = -__BAG__.groundAt(carts.enemy.x) + 200;
      lookTarget.set(carts.enemy.x - 200, -__BAG__.groundAt(carts.enemy.x), 0);
    }

    camera.position.x += (camTargetX - camera.position.x) * 0.05;
    camera.position.y += (camTargetY - camera.position.y) * 0.05;
    camera.position.z += (camTargetZ - camera.position.z) * 0.05;
    
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
  
})();
