/* =============================================================
   shootingStars.js
   Occasional realistic meteors that streak across the background:
     • A bright pearly head that fades into a long tail.
     • Each star is a single stretched plane with a procedurally
       drawn gradient streak texture (no external assets).
     • Stars are pooled (3 by default) and re-used as they spawn.
     • Each one is billboarded toward the camera every frame, then
       rotated to align with its travel direction — so the streak
       always reads correctly no matter the scroll camera angle.
   ============================================================= */

import * as THREE from 'three';

/* ---------- Procedural streak texture ----------
   A long horizontal gradient that looks like burning fire:
     • Deep ember-red at the very tail (left) → fading orange →
       golden yellow → white-hot core at the head (right).
     • Top/bottom edges tapered so the streak reads as a thin line. */
function makeStreakTexture(w = 512, h = 32) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Horizontal: tail (left) → head (right). Fire color ramp.
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0.00, 'rgba(255, 90,  20,  0)');     // dies out
  g.addColorStop(0.35, 'rgba(255, 110, 30,  0.18)');  // deep ember red
  g.addColorStop(0.65, 'rgba(255, 170, 50,  0.45)');  // burning orange
  g.addColorStop(0.85, 'rgba(255, 215, 90,  0.85)');  // golden yellow
  g.addColorStop(0.96, 'rgba(255, 245, 180, 1.00)');  // white-hot
  g.addColorStop(1.00, 'rgba(255, 255, 220, 0)');     // soft edge
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Vertical taper — fade out top/bottom so it reads as a thin streak.
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0.00, 'rgba(0, 0, 0, 1)');
  v.addColorStop(0.50, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1.00, 'rgba(0, 0, 0, 1)');
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // White-hot fireball head — radial gradient on top of the streak.
  const headX = w * 0.96;
  const headR = h * 0.65;
  const head  = ctx.createRadialGradient(headX, h / 2, 0, headX, h / 2, headR);
  head.addColorStop(0.00, 'rgba(255, 255, 230, 1)');  // white-hot core
  head.addColorStop(0.35, 'rgba(255, 230, 120, 0.9)');// yellow flame
  head.addColorStop(0.70, 'rgba(255, 160, 40,  0.5)');// orange halo
  head.addColorStop(1.00, 'rgba(255, 90,  10,  0)');  // ember edge
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(headX, h / 2, headR, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function createShootingStars(scene, camera, {
  poolSize = window.matchMedia("(max-width: 768px)").matches ? 1 : 2,
  // Avg seconds between spawns — picked randomly inside [min, max].
  spawnInterval = window.matchMedia("(max-width: 768px)").matches ? [10, 20] : [6, 14],
  streakLength = 3.0,
  streakWidth  = 0.20,
  // Where stars live in world space (deep behind the crystal so they read
  // as far-away — the further back, the slower they appear to move).
  spawnArea = {
    xMin: -14, xMax: 14,
    yMin:   3, yMax:  9,
    zMin: -18, zMax: -8,
  },
  travel = {
    // Shorter travel distance + much longer lifetime = that
    // "distant meteor you can actually watch fall" feeling.
    distMin: 5, distMax: 9,
    // Travel angle is mostly downward + diagonal across the sky.
    angleMin: -Math.PI * 0.85,  // ~-153°
    angleMax: -Math.PI * 0.55,  // ~-99°
  },
  // Seconds the meteor is alive on screen — dramatically slowed down.
  lifetime = [5.5, 9.0],
} = {}) {

  const texture = makeStreakTexture();

  /* ---------- Pool ---------- */
  const stars = [];
  for (let i = 0; i < poolSize; i++) {
    const geo = new THREE.PlaneGeometry(streakLength, streakWidth);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: 0xffc14a, // burning yellow-amber tint
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.renderOrder = 2;
    scene.add(mesh);

    stars.push({
      mesh, mat,
      active: false,
      t: 0,
      duration: 1,
      angle: 0,
      start: new THREE.Vector3(),
      end:   new THREE.Vector3(),
    });
  }

  /* ---------- Spawn scheduling ---------- */
  let timer = 0;
  let nextSpawn = THREE.MathUtils.randFloat(1.5, 4); // first one fairly soon

  function spawn() {
    const star = stars.find(s => !s.active);
    if (!star) return;

    // Pick a random starting position in the upper sky.
    const sx = THREE.MathUtils.randFloat(spawnArea.xMin, spawnArea.xMax);
    const sy = THREE.MathUtils.randFloat(spawnArea.yMin, spawnArea.yMax);
    const sz = THREE.MathUtils.randFloat(spawnArea.zMin, spawnArea.zMax);

    // Pick a travel direction (mostly downward, diagonal).
    const angle = THREE.MathUtils.randFloat(travel.angleMin, travel.angleMax);
    const dist  = THREE.MathUtils.randFloat(travel.distMin,  travel.distMax);

    star.start.set(sx, sy, sz);
    star.end.set(
      sx + Math.cos(angle) * dist,
      sy + Math.sin(angle) * dist,
      sz + THREE.MathUtils.randFloatSpread(1.5)
    );
    star.angle    = angle;
    star.duration = THREE.MathUtils.randFloat(lifetime[0], lifetime[1]);
    star.t        = 0;
    star.active   = true;

    // Slight scale variation so they don't feel cloned.
    const s = THREE.MathUtils.randFloat(0.8, 1.25);
    star.mesh.scale.set(s, s, 1);

    star.mesh.position.copy(star.start);
    star.mesh.visible = true;
  }

  /* ---------- Per-frame update ---------- */
  const tmpDir = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpUp = new THREE.Vector3(0, 0, 1);

  function update(_elapsed, dt) {
    // Spawn timer
    timer += dt;
    if (timer >= nextSpawn) {
      timer = 0;
      nextSpawn = THREE.MathUtils.randFloat(spawnInterval[0], spawnInterval[1]);
      spawn();
    }

    for (const star of stars) {
      if (!star.active) continue;

      star.t += dt;
      const p = star.t / star.duration;
      if (p >= 1) {
        star.active = false;
        star.mesh.visible = false;
        star.mat.opacity = 0;
        continue;
      }

      // Almost-linear motion with a tiny ease-in — distant objects
      // appear to move at constant speed, no sudden acceleration.
      const eased = p * (1.0 + 0.15 * (1.0 - p));
      star.mesh.position.lerpVectors(star.start, star.end, Math.min(eased, 1));

      // Billboard toward camera, then rotate so the streak points
      // along the travel direction in camera-facing space.
      star.mesh.lookAt(camera.position);
      star.mesh.rotateOnAxis(tmpUp, star.angle);

      // Opacity envelope — gentle fade in, long steady burn,
      // long slow fade out. Multiplied with a small fire flicker so
      // the burning meteor isn't visually static for 6+ seconds.
      let alpha;
      if (p < 0.18)      alpha = p / 0.18;                      // fade in
      else if (p > 0.55) alpha = 1 - (p - 0.55) / 0.45;          // long fade out
      else               alpha = 1;

      const flicker = 0.88 + 0.12 * Math.sin(star.t * 22 + star.angle);
      star.mat.opacity = alpha * flicker;
    }
  }

  function dispose() {
    stars.forEach(({ mesh, mat }) => {
      mesh.geometry.dispose();
      mat.dispose();
      scene.remove(mesh);
    });
    texture.dispose();
  }

  return { stars, update, dispose, _spawnNow: spawn };
}
