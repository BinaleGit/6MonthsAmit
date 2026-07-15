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
  { pos: new THREE.Vector3( 2.0 * xMulti,    2.0,  3.6 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // memory-3b
  { pos: new THREE.Vector3( 0.0,             0.0,  4.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // memory-3c
  { pos: new THREE.Vector3( 0.0,             0.0,  9.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // timeline
  { pos: new THREE.Vector3(-2.0 * xMulti,   -1.0,  6.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // video-1
  { pos: new THREE.Vector3( 2.0 * xMulti,    1.0,  6.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // video-2
  { pos: new THREE.Vector3( 0.0,             0.0,  7.0 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // video-3
  { pos: new THREE.Vector3( 0.0,             0.0,  4.5 + zOffset), look: new THREE.Vector3(0, 0, 0) }, // flower
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
        end: () => "+=" + (track.scrollWidth || window.innerWidth),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        refreshPriority: 10,
        anticipatePin: 1,
      }
    });
  }

  // Watch for layout shifts only on specific elements if needed, but DO NOT observe body on mobile!
  // GSAP natively handles window resizing and intelligently ignores URL bar hiding/showing on mobile.
  
  // 3. Videos Autoplay on Scroll
  gsap.utils.toArray('.panel--video').forEach((panel) => {
    const video = panel.querySelector('video');
    if (!video) return;

    // Force load for mobile to prevent black screens
    video.load();
    
    const safePlay = () => {
      const p = video.play();
      if (p !== undefined) {
        p.catch(e => console.warn("Video play prevented:", e));
      }
    };

    ScrollTrigger.create({
      trigger: panel,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: safePlay,
      onLeave: () => video.pause(),
      onEnterBack: safePlay,
      onLeaveBack: () => video.pause()
    });
  });

  // 3.5 Lower background music volume when in the videos section
  const firstVideo = document.querySelector('[data-panel="video-1"]');
  const lastVideo = document.querySelector('[data-panel="video-3"]');
  const bgMusic = document.getElementById('bg-music');

  if (firstVideo && lastVideo && bgMusic) {
    ScrollTrigger.create({
      trigger: firstVideo,
      endTrigger: lastVideo,
      start: "top 75%",
      end: "bottom 25%",
      onEnter: () => gsap.to(bgMusic, { volume: 0.05, duration: 1.5, overwrite: "auto" }),
      onLeave: () => gsap.to(bgMusic, { volume: 0.4, duration: 1.5, overwrite: "auto" }),
      onEnterBack: () => gsap.to(bgMusic, { volume: 0.05, duration: 1.5, overwrite: "auto" }),
      onLeaveBack: () => gsap.to(bgMusic, { volume: 0.4, duration: 1.5, overwrite: "auto" })
    });
  }

  // 4. Flower Sequence
  const flowerSection = document.getElementById('flower-section');
  const flowerCanvas = document.getElementById('flower-canvas');
  const blackOverlay = document.getElementById('black-overlay');

  if (flowerSection && flowerCanvas) {
    const ctx = flowerCanvas.getContext('2d');
    
    const setCanvasSize = () => {
      flowerCanvas.width = window.innerWidth;
      flowerCanvas.height = window.innerHeight;
    };
    setCanvasSize();

    const frameCount = 100;
    const currentFrame = index => (
      `./assets/flower/create_A_macro_ultra_high_def_gwr_video_mvp_${index.toString().padStart(3, '0')}.jpg`
    );

    const images = [];
    const flowerObj = { frame: 0 };

    for (let i = 0; i < frameCount; i++) {
      images.push(new Image());
    }

    // Preload first frame immediately to draw something initially
    images[0].decoding = "async";
    images[0].onload = () => {
      renderFlower();
    };
    images[0].src = currentFrame(0);
    
    const loadRestOfFrames = () => {
      // Only load if not already loading
      if (flowerObj.isLoading) return;
      flowerObj.isLoading = true;
      
      // Load frames in batches to avoid freezing the browser
      let i = 1;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      function loadBatch() {
        const batchSize = isMobile ? 3 : 8;
        const batchEnd = Math.min(i + batchSize, frameCount);
        for (; i < batchEnd; i++) {
          images[i].decoding = "async";
          images[i].src = currentFrame(i);
        }
        if (i < frameCount) {
          setTimeout(loadBatch, isMobile ? 120 : 60);
        }
      }
      loadBatch();
    };

    // Trigger loading when scrolling near the flower section
    ScrollTrigger.create({
      trigger: flowerSection,
      start: "top bottom", // Start loading only when the section enters the screen
      onEnter: loadRestOfFrames,
      once: true
    });

    function renderFlower() {
      const img = images[flowerObj.frame];
      if (!img || !img.complete || img.naturalWidth === 0) return;
      
      const canvasWidth = flowerCanvas.width;
      const canvasHeight = flowerCanvas.height;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      const scale = Math.min((canvasWidth * 0.8) / imgWidth, (canvasHeight * 0.8) / imgHeight);
      const x = (canvasWidth / 2) - (imgWidth / 2) * scale;
      const y = (canvasHeight / 2) - (imgHeight / 2) * scale;
      
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, x, y, imgWidth * scale, imgHeight * scale);
    }

    window.addEventListener('resize', () => {
      setCanvasSize();
      renderFlower();
    });

    // =====================================================================
    // 🌺 FLOWER ANIMATION TIMING CONTROLS (EDIT THESE TO DELAY THE START)
    // =====================================================================
    // To fix the issue where it starts too early on mobile (after the first video), 
    // we can change the 'start' trigger positions specifically for mobile.
    // 
    // "top 75%" means the animation starts when the top of the flower section 
    // is 75% of the way down the screen.
    // Changing it to "top bottom" or "top 20%" will delay it further.
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    
    // 1. Controls when the black background starts fading in
    const overlayStart = isMobile ? "top 20%" : "top 75%"; 
    
    // 2. Controls when the flower actually pins and starts playing
    const flowerPinStart = isMobile ? "top 30%" : "center center";
    // =====================================================================

    // Fade IN the black overlay (can be created before pin)
    if (blackOverlay) {
      gsap.fromTo(blackOverlay, 
        { opacity: 0 },
        {
          opacity: 1,
          ease: "none",
          immediateRender: false,
          scrollTrigger: {
            trigger: flowerSection,
            start: overlayStart, // <-- Uses the variable defined above
            end: "center center",
            scrub: true
          }
        }
      );
    }

    // MAIN PINNED TIMELINE
    const tlFlower = gsap.timeline({
      scrollTrigger: {
        trigger: flowerSection,
        start: flowerPinStart, // <-- Uses the variable defined above
        end: "+=400%", // pin for 4 viewport heights
        pin: true,
        scrub: 0.5,
        anticipatePin: 1, // Add this to help smooth pinning on mobile
        refreshPriority: 5,
        onUpdate: () => renderFlower()
      }
    });

    // Fade in canvas
    tlFlower.fromTo(flowerCanvas, { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0);

    // Scrub through frames
    tlFlower.to(flowerObj, {
      frame: frameCount - 1,
      snap: "frame",
      ease: "none",
      duration: 1
    }, 0);

    // Text animations synced with timeline progress
    tlFlower.fromTo("#flower-text-1", 
      { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.05
    ).to("#flower-text-1", 
      { opacity: 0, duration: 0.05 }, 0.25
    );

    tlFlower.fromTo("#flower-text-2", 
      { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.35
    ).to("#flower-text-2", 
      { opacity: 0, duration: 0.05 }, 0.60
    );

    tlFlower.fromTo("#flower-text-3", 
      { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.70
    ).to("#flower-text-3", 
      { opacity: 0, duration: 0.05 }, 0.90
    );

    // Fade out the canvas itself at the end of the flower sequence
    tlFlower.to(flowerCanvas, { opacity: 0, duration: 0.05 }, 0.95);

    // Fade OUT the black overlay synced with the end of the pin
    if (blackOverlay) {
      tlFlower.to(blackOverlay, { opacity: 0, duration: 0.1 }, 0.9);
    }
  }

  // 5. Camera Flythrough & Couple Sync
  const panels = gsap.utils.toArray('.panel');
  const camState = {
    x: WAYPOINTS[0].pos.x, y: WAYPOINTS[0].pos.y, z: WAYPOINTS[0].pos.z,
    lx: WAYPOINTS[0].look.x, ly: WAYPOINTS[0].look.y, lz: WAYPOINTS[0].look.z,
    progress: 0
  };

  const updateCamera = () => {
    camera.position.set(camState.x, camState.y, camState.z);
    camera.lookAt(camState.lx, camState.ly, camState.lz);
    if (couple && couple.setScrollProgress) {
      couple.setScrollProgress(camState.progress);
    }
  };

  updateCamera();

  if (panels.length === WAYPOINTS.length) {
    panels.forEach((panel, i) => {
      if (i === 0) return;
      const prevWp = WAYPOINTS[i - 1];
      const curWp = WAYPOINTS[i];
      
      gsap.fromTo(camState,
        {
          x: prevWp.pos.x, y: prevWp.pos.y, z: prevWp.pos.z,
          lx: prevWp.look.x, ly: prevWp.look.y, lz: prevWp.look.z,
          progress: (i - 1) / (WAYPOINTS.length - 1)
        },
        {
          x: curWp.pos.x, y: curWp.pos.y, z: curWp.pos.z,
          lx: curWp.look.x, ly: curWp.look.y, lz: curWp.look.z,
          progress: i / (WAYPOINTS.length - 1),
          ease: "sine.inOut",
          scrollTrigger: {
            trigger: panel,
            start: "top bottom",
            end: "top top",
            scrub: true,
            onUpdate: updateCamera
          }
        }
      );
    });
  }

  // Force an immediate refresh so texts and initial animations appear right away
  // Sort triggers by their start position so that pinSpacing is calculated correctly 
  // for triggers created out of DOM order (e.g. reveals, camera flythrough)
  ScrollTrigger.sort();
  ScrollTrigger.refresh();

  if (document.readyState === 'complete') {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  } else {
    window.addEventListener('load', () => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  }
}