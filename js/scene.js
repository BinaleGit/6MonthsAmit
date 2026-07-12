/* =============================================================
   scene.js
   Sets up the Three.js renderer, scene, camera and romantic
   lighting rig (soft pink + deep purple + warm gold).
   Exports a single `createScene(canvas)` factory.
   ============================================================= */

import * as THREE from 'three';

export function createScene(canvas) {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  /* ---------- Renderer ---------- */
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: true,            // transparent background so CSS gradient shows through
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0); // transparent
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  /* ---------- Scene ---------- */
  const scene = new THREE.Scene();
  // A whisper of fog to soften the depths and pull particles into atmosphere.
  scene.fog = new THREE.FogExp2(0x07050d, 0.045);

  /* ---------- Camera ---------- */
  const camera = new THREE.PerspectiveCamera(
    38,                                          // narrowish FOV = cinematic
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);

  /* ---------- Lights ----------
     A three-point rig in romantic colors:
       • KEY  → soft pink from upper-left
       • FILL → deep purple from lower-right
       • RIM  → warm gold from behind
     Plus a tiny ambient lift so shadows never go fully black. */
  const ambient = new THREE.AmbientLight(0x2a1c3d, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.PointLight(0xff9ec7, 18, 30, 2); // soft pink
  keyLight.position.set(-3.5, 3, 3);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x7a3fb8, 14, 30, 2); // deep purple
  fillLight.position.set(3, -2.5, 2.5);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xffc98a, 22, 30, 2);  // warm gold
  rimLight.position.set(0, 1.5, -4);
  scene.add(rimLight);

  // A faint top hemisphere fill to suggest sky / ground ambient bounce.
  const hemi = new THREE.HemisphereLight(0xffb3d1, 0x1a0b2e, 0.25);
  scene.add(hemi);

  /* ---------- Resize ---------- */
  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 1.5));
  }
  window.addEventListener('resize', handleResize);

  return {
    renderer,
    scene,
    camera,
    lights: { ambient, keyLight, fillLight, rimLight, hemi },
    dispose() {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    },
  };
}
