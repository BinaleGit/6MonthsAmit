import * as THREE from 'three';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

// Detect if the user is on a mobile-sized screen
const isMobile = window.matchMedia("(max-width: 768px)").matches;

// Shrink horizontal panning on mobile, and pull the camera back (Z) to fit the view
const xMulti = isMobile ? 0.4 : 1.0; 
const zOffset = isMobile ? 2.5 : 0.0;

const WAYPOINTS = [
  { pos: new THREE.Vector3( 0.0,             0.0,  6.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // hero
  { pos: new THREE.Vector3(-3.2 * xMulti,    0.6,  4.6 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // memory-1
  { pos: new THREE.Vector3( 3.4 * xMulti,   -0.8,  4.4 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // memory-2
  { pos: new THREE.Vector3(-2.0 * xMulti,    3.2,  3.6 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // memory-3
  { pos: new THREE.Vector3( 0.0,             0.0,  9.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // timeline
  { pos: new THREE.Vector3( 2.0 * xMulti,    2.0,  5.5 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // memory-4
  { pos: new THREE.Vector3( 0.0,             0.0,  3.2 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // outro
];

export function initScrollAnimations({ camera, couple }) {
  // 1. Fade reveals
  gsap.utils.toArray('.panel').forEach((panel) => {
    const reveals = panel.querySelectorAll('.reveal');
    if (!reveals.length) return;

    gsap.to(reveals, {
      opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: {
        trigger: panel, start: 'top 75%', end: 'top 30%', toggleActions: 'play none none reverse',
      },
    });
  });

  // 2. Horizontal Timeline Scroll (RTL Logic)
  const track = document.getElementById('timeline-track');
  const timelineSection = document.getElementById('timeline');
  
  if (track && timelineSection) {
    gsap.to(track, {
      x: () => track.scrollWidth - window.innerWidth + 100, 
      ease: "none",
      scrollTrigger: {
        trigger: timelineSection,
        start: "center center",
        end: () => "+=" + track.scrollWidth,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      }
    });
  }

  // 3. Camera Flythrough & Couple Sync
  const proxy = { progress: 0 };
  const tmpPos = new THREE.Vector3();
  const tmpLook = new THREE.Vector3();

  function applyProgress(p) {
    const total = WAYPOINTS.length - 1;
    const scaled = THREE.MathUtils.clamp(p, 0, 1) * total;
    const i = Math.floor(scaled);
    const t = scaled - i;
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[Math.min(i + 1, total)];
    const ts = t * t * (3 - 2 * t);

    tmpPos.lerpVectors(a.pos, b.pos, ts);
    tmpLook.lerpVectors(a.look, b.look, ts);

    camera.position.copy(tmpPos);
    camera.lookAt(tmpLook);

    // Tell the couple exactly where we are in the scroll!
    if (couple && couple.setScrollProgress) {
      couple.setScrollProgress(p);
    }
  }

  applyProgress(0);

  gsap.to(proxy, {
    progress: 1, ease: 'none',
    scrollTrigger: {
      trigger: '#content', start: 'top top', end: 'bottom bottom', scrub: 1.2, invalidateOnRefresh: true,
    },
    onUpdate: () => applyProgress(proxy.progress),
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}