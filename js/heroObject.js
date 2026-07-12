import * as THREE from 'three';

export function createHeroObject(scene) {
  const group = new THREE.Group();
  group.name = 'HeroObject';
  scene.add(group);

  /* ---------- Create a 2D Heart Shape ---------- */
  const heartShape = new THREE.Shape();
  const x = 0, y = 0;
  heartShape.moveTo(x + 5, y + 5);
  heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
  heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
  heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
  heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
  heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
  heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);

  /* ---------- Extrude into 3D ---------- */
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const extrudeSettings = {
    depth: 2.5,
    bevelEnabled: true,
    bevelSegments: isMobile ? 1 : 2,
    steps: 1,
    bevelSize: 1.5,
    bevelThickness: 1.5
  };
  const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);

  // Center the geometry
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  // Scale and flip right-side up
  geometry.scale(0.06, 0.06, 0.06);
  geometry.rotateZ(Math.PI); 

  /* ---------- Glass Material ---------- */
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ffd2e6'),
    metalness: 0.2,
    roughness: 0.2,
    transparent: true,
    opacity: 0.85,
    emissive: new THREE.Color('#3a1530'),
    emissiveIntensity: 0.6,
    flatShading: true, 
    side: THREE.DoubleSide,
  });

  const heartMesh = new THREE.Mesh(geometry, material);
  group.add(heartMesh);

  /* ---------- Mouse Parallax ---------- */
  const pointer = { x: 0, y: 0 };
  const target  = { x: 0, y: 0 };

  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth)  * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  /* ---------- Animation Loop ---------- */
  function update(elapsed, dt) {
    target.x += (pointer.x - target.x) * 0.06;
    target.y += (pointer.y - target.y) * 0.06;

    // Gentle continuous rotation
    heartMesh.rotation.y += dt * 0.25;
    heartMesh.rotation.x += dt * 0.12;

    group.rotation.y = target.x * 0.6;
    group.rotation.x = -target.y * 0.4;
    group.position.y = Math.sin(elapsed * 0.6) * 0.08;

    // Heartbeat pulse applied directly to the main crystal!
    // Base scale is 1.0, we add rhythmic spikes to it.
    const beat =
      1.0 +
      Math.pow(Math.sin(elapsed * 1.6), 16) * 0.12 +
      Math.pow(Math.sin(elapsed * 1.6 + 0.35), 16) * 0.06;
      
    heartMesh.scale.setScalar(beat);

    // Pulse the glowing intensity along with the physical beat
    material.emissiveIntensity = 0.4 + (beat - 1.0) * 5.0;
  }

  function dispose() {
    window.removeEventListener('pointermove', onPointerMove);
    geometry.dispose();
    material.dispose();
    scene.remove(group);
  }

  // Notice we no longer return `core` here
  return { group, heartMesh, update, dispose };
}