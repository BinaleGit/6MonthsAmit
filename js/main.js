/* =============================================================
   main.js — entry point
   Boots the Three.js scene, attaches the hero crystal and the
   particle field, wires GSAP ScrollTrigger animations, and runs
   the render loop.
   ============================================================= */

import * as THREE                from 'three';
import { createScene }           from './scene.js';
import { createHeroObject }      from './heroObject.js';
import { createParticles }       from './particles.js';
import { createFallingHearts }   from './fallingHearts.js';
import { createShootingStars }   from './shootingStars.js';
import { initScrollAnimations }  from './scrollAnimations.js';
import { createCoupleAnimation } from './coupleAnimation.js';

(function boot() {
  const canvas = document.getElementById('webgl');
  const preloader = document.getElementById('preloader');

  /* ---------- Build the scene ---------- */
  // Cut heavy work in half for phones so older devices don't heat up / stutter.
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const { renderer, scene, camera } = createScene(canvas);
  const hero      = createHeroObject(scene);
  const particles = createParticles(scene, { count: isMobile ? 600 : 1400, radius: 18 });
  const stars     = createShootingStars(scene, camera);
  const couple    = createCoupleAnimation(scene);   
  
  /* ---------- Scroll-driven camera + reveals ---------- */
  // Pass the couple to the scroll animations so it can sync with the scroll progress
  initScrollAnimations({ camera, couple });

  /* ---------- Background music ---------- */
  setupMusicToggle();

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  function tick() {
    const dt      = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    hero.update(elapsed, dt);
    particles.update(elapsed, dt);
    stars.update(elapsed, dt);
    couple.update(elapsed);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  /* ---------- Hide preloader on next frame ---------- */
  requestAnimationFrame(() => {
    requestAnimationFrame(() => preloader.classList.add('is-hidden'));
  });

  /* ---------- Expose for debugging in console ---------- */
  window.__app = { renderer, scene, camera, hero, particles, stars, couple, THREE };
})();

/* =============================================================
   setupMusicToggle
   ============================================================= */
function setupMusicToggle() {
  const btn   = document.getElementById('music-btn');
  const audio = document.getElementById('bg-music');
  if (!btn || !audio) return;

  const TARGET_VOLUME = 0.4;          
  const FADE_MS       = 900;
  audio.volume = 0;                   

  const label = btn.querySelector('.music-btn__label');
  const icon  = btn.querySelector('.music-btn__icon');

  function setUI(playing) {
    btn.classList.toggle('is-playing', playing);
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? 'Pause our song' : 'Play our song');
    if (label) label.textContent = playing ? 'Pause our song' : 'Play our song';
    if (icon)  icon.textContent  = playing ? '❚❚' : '♪';
  }

  function fadeTo(targetVol, durationMs, onDone) {
    const startVol = audio.volume;
    const startAt  = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startAt) / durationMs);
      audio.volume = startVol + (targetVol - startVol) * t;
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  }

  btn.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        audio.volume = 0;
        await audio.play();
        setUI(true);
        fadeTo(TARGET_VOLUME, FADE_MS);
      } catch (err) {
        console.warn('[music] play() rejected:', err);
        setUI(false);
      }
    } else {
      fadeTo(0, FADE_MS, () => audio.pause());
      setUI(false);
    }
  });

  audio.addEventListener('pause', () => setUI(false));
  audio.addEventListener('play',  () => setUI(true));
  audio.addEventListener('ended', () => setUI(false));
}