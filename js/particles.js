/* =============================================================
   particles.js
   A soft, drifting field of "fireflies" / dust motes.
   Uses a single THREE.Points with a custom ShaderMaterial so each
   particle is a glowing, additive disc that twinkles independently
   and responds gently to the mouse.
   ============================================================= */

import * as THREE from 'three';

export function createParticles(scene, { count = 1400, radius = 18 } = {}) {
  /* ---------- Buffers ---------- */
  const positions = new Float32Array(count * 3);
  const colors    = new Float32Array(count * 3);
  const sizes     = new Float32Array(count);
  const seeds     = new Float32Array(count);

  // Three romantic colors to randomly pick from.
  const palette = [
    new THREE.Color('#ffb3d1'),  // soft pink
    new THREE.Color('#f6c478'),  // warm gold
    new THREE.Color('#c9a4ff'),  // lavender
  ];

  for (let i = 0; i < count; i++) {
    // Distribute inside a sphere, biased toward outer shells for atmosphere.
    const r = radius * Math.pow(Math.random(), 0.55);
    const theta = Math.random() * Math.PI * 2;
    const phi   = Math.acos(2 * Math.random() - 1);

    positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3 + 0] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = THREE.MathUtils.randFloat(6, 28);
    seeds[i] = Math.random() * 1000;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor',   new THREE.BufferAttribute(colors,    3));
  geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes,     1));
  geometry.setAttribute('aSeed',    new THREE.BufferAttribute(seeds,     1));

  /* ---------- Shader material ----------
     - Vertex: applies a per-particle twinkle and a gentle global
       drift so the whole field breathes.
     - Fragment: builds a soft, round, glowing disc with an additive
       falloff so overlaps bloom together. */
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime:      { value: 0 },
      uPointer:   { value: new THREE.Vector2(0, 0) }, // smoothed -1..1
      uPixelRatio:{ value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: /* glsl */`
      attribute vec3  aColor;
      attribute float aSize;
      attribute float aSeed;

      uniform float uTime;
      uniform vec2  uPointer;
      uniform float uPixelRatio;

      varying vec3  vColor;
      varying float vTwinkle;

      void main() {
        vec3 pos = position;

        // Gentle, per-particle drifting motion.
        float t = uTime * 0.15 + aSeed;
        pos.x += sin(t)        * 0.25;
        pos.y += cos(t * 1.13) * 0.30;
        pos.z += sin(t * 0.7)  * 0.20;

        // Mouse parallax — particles further from camera move more
        // (z<0 → larger offset). Creates a 3D depth feel.
        float depth = clamp((-pos.z + 8.0) / 16.0, 0.0, 1.0);
        pos.x += uPointer.x * depth * 1.2;
        pos.y += -uPointer.y * depth * 1.2;

        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;

        // Size attenuates with distance + a twinkle
        float twinkle = 0.55 + 0.45 * sin(uTime * 1.8 + aSeed * 6.2831);
        vTwinkle = twinkle;

        gl_PointSize = aSize * uPixelRatio * twinkle * (1.0 / -mv.z);
        vColor = aColor;
      }
    `,
    fragmentShader: /* glsl */`
      varying vec3  vColor;
      varying float vTwinkle;

      void main() {
        // Soft round disc with bloom-y falloff.
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float alpha = smoothstep(0.5, 0.0, d);
        alpha = pow(alpha, 2.2);

        // Warm core, colored halo.
        vec3 core = mix(vColor, vec3(1.0, 0.95, 0.85), 0.35);
        vec3 col  = mix(vColor, core, smoothstep(0.5, 0.0, d));

        gl_FragColor = vec4(col, alpha * vTwinkle * 0.9);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.name = 'Particles';
  scene.add(points);

  /* ---------- Mouse tracking ---------- */
  const pointerTarget = new THREE.Vector2(0, 0);
  function onPointerMove(e) {
    pointerTarget.x = (e.clientX / window.innerWidth)  * 2 - 1;
    pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  function onResize() {
    material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
  }
  window.addEventListener('resize', onResize);

  /* ---------- Per-frame update ---------- */
  const smoothedPointer = new THREE.Vector2(0, 0);
  function update(elapsed, dt) {
    smoothedPointer.lerp(pointerTarget, 0.04);
    material.uniforms.uTime.value = elapsed;
    material.uniforms.uPointer.value.copy(smoothedPointer);

    // Slow global rotation so the field feels like a galaxy of dust.
    points.rotation.y += dt * 0.015;
    points.rotation.x += dt * 0.005;
  }

  function dispose() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('resize', onResize);
    geometry.dispose();
    material.dispose();
    scene.remove(points);
  }

  return { points, update, dispose };
}
