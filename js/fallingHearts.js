/* =============================================================
   fallingHearts.js
   A small flock of soft pink hearts that fall slowly through the
   background of the 3D scene. They live behind the crystal so the
   scroll camera moves naturally parallax across them.
   ============================================================= */

   import * as THREE from 'three';

   /* ---------- High-Definition Procedural Heart ----------
      Upgraded to 512px with rich gradients, a subtle drop shadow, 
      and a soft pearlescent highlight for maximum quality. */
   function makeHeartTexture(size = 512) {
     const canvas = document.createElement('canvas');
     canvas.width = canvas.height = size;
     const ctx = canvas.getContext('2d');
   
     const cx = size / 2;
     const cy = size * 0.42;
     const w  = size * 0.58;
     const h  = size * 0.54;
   
     // 1. Richer outer glow halo
     const halo = ctx.createRadialGradient(cx, cy + h * 0.25, 0, cx, cy + h * 0.25, size * 0.5);
     halo.addColorStop(0,    'rgba(255, 179, 209, 0.40)');
     halo.addColorStop(0.4,  'rgba(255, 121, 198, 0.15)');
     halo.addColorStop(1,    'rgba(255, 121, 198, 0)');
     ctx.fillStyle = halo;
     ctx.fillRect(0, 0, size, size);
   
     // Heart path math
     function tracePath() {
       ctx.beginPath();
       ctx.moveTo(cx, cy + h * 0.25);
       ctx.bezierCurveTo(cx,         cy,             cx - w / 2,  cy,             cx - w / 2, cy + h * 0.25);
       ctx.bezierCurveTo(cx - w / 2, cy + h * 0.55, cx,          cy + h * 0.85, cx,          cy + h);
       ctx.bezierCurveTo(cx,         cy + h * 0.85, cx + w / 2,  cy + h * 0.55, cx + w / 2,  cy + h * 0.25);
       ctx.bezierCurveTo(cx + w / 2, cy,             cx,          cy,             cx,          cy + h * 0.25);
       ctx.closePath();
     }
   
     // 2. Add drop shadow to give the heart physical depth
     ctx.shadowColor = 'rgba(255, 105, 180, 0.5)';
     ctx.shadowBlur = size * 0.04;
     ctx.shadowOffsetY = size * 0.01;
   
     // 3. Premium pearlescent fill — brighter core, deeper magenta edges
     tracePath();
     const fill = ctx.createRadialGradient(cx - w * 0.15, cy + h * 0.2, 0, cx, cy + h * 0.45, w * 0.75);
     fill.addColorStop(0,   'rgba(255, 255, 255, 1)');      // Pure white hot spot
     fill.addColorStop(0.3, 'rgba(255, 210, 230, 1)');      // Soft pearl pink
     fill.addColorStop(0.7, 'rgba(255, 140, 195, 0.95)');   // Mid pink
     fill.addColorStop(1,   'rgba(230, 80, 160, 0.9)');     // Deep edge
     ctx.fillStyle = fill;
     ctx.fill();
   
     // Reset shadow for the fine details
     ctx.shadowColor = 'transparent';
     ctx.shadowBlur = 0;
   
     // 4. Crisp, bright inner stroke so edges never blur
     tracePath();
     ctx.lineWidth = Math.max(2, size * 0.015);
     ctx.strokeStyle = 'rgba(255, 240, 250, 0.8)';
     ctx.stroke();
   
     // 5. Soft fading ceramic highlight (looks like curved glass)
     ctx.beginPath();
     ctx.ellipse(cx - w * 0.2, cy + h * 0.15, w * 0.1, h * 0.06, -0.7, 0, Math.PI * 2);
     const highlight = ctx.createLinearGradient(cx - w * 0.3, cy, cx - w * 0.1, cy + h * 0.2);
     highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
     highlight.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
     ctx.fillStyle = highlight;
     ctx.fill();
   
     // 6. Max out texture sampling quality
     const tex = new THREE.CanvasTexture(canvas);
     tex.colorSpace = THREE.SRGBColorSpace;
     tex.anisotropy = 16; // Upgraded from 8 to 16 for sharpest off-angle viewing
     tex.minFilter = THREE.LinearMipmapLinearFilter;
     tex.magFilter = THREE.LinearFilter;
     tex.generateMipmaps = true;
     return tex;
   }
   
   export function createFallingHearts(scene, {
     count = 32,                 
     rangeX = 20,                
     rangeY = 18,                
     rangeZ = 12,                
     zOffset = -5,               
     fallSpeed = [0.12, 0.28],   
     sizeRange = [20, 42],       
     spinSpeed = [-0.4, 0.4],    
   } = {}) {
   
     // Generate the new high-res texture
     const texture = makeHeartTexture(512);
   
     const positions  = new Float32Array(count * 3);
     const seeds      = new Float32Array(count);
     const speeds     = new Float32Array(count);
     const sizes      = new Float32Array(count);
     const sways      = new Float32Array(count);
     const spins      = new Float32Array(count);
     const phases     = new Float32Array(count);
   
     for (let i = 0; i < count; i++) {
       positions[i * 3 + 0] = (Math.random() * 2 - 1) * rangeX;
       positions[i * 3 + 1] = (Math.random() * 2 - 1) * rangeY;
       positions[i * 3 + 2] = (Math.random() * 2 - 1) * rangeZ + zOffset;
   
       seeds[i]  = Math.random() * 1000;
       speeds[i] = THREE.MathUtils.randFloat(fallSpeed[0], fallSpeed[1]);
       sizes[i]  = THREE.MathUtils.randFloat(sizeRange[0], sizeRange[1]);
       sways[i]  = THREE.MathUtils.randFloat(0.18, 0.55);
       spins[i]  = THREE.MathUtils.randFloat(spinSpeed[0], spinSpeed[1]);
       phases[i] = Math.random() * Math.PI * 2;
     }
   
     const geometry = new THREE.BufferGeometry();
     geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
     geometry.setAttribute('aSeed',    new THREE.BufferAttribute(seeds,     1));
     geometry.setAttribute('aSpeed',   new THREE.BufferAttribute(speeds,    1));
     geometry.setAttribute('aSize',    new THREE.BufferAttribute(sizes,     1));
     geometry.setAttribute('aSway',    new THREE.BufferAttribute(sways,     1));
     geometry.setAttribute('aSpin',    new THREE.BufferAttribute(spins,     1));
     geometry.setAttribute('aPhase',   new THREE.BufferAttribute(phases,    1));
   
     const material = new THREE.ShaderMaterial({
       transparent: true,
       depthWrite: false,
       blending: THREE.AdditiveBlending,
       uniforms: {
         uTime:       { value: 0 },
         uMap:        { value: texture },
         uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
         uRangeY:     { value: rangeY },
       },
       vertexShader: /* glsl */`
         attribute float aSeed;
         attribute float aSpeed;
         attribute float aSize;
         attribute float aSway;
         attribute float aSpin;
         attribute float aPhase;
   
         uniform float uTime;
         uniform float uPixelRatio;
         uniform float uRangeY;
   
         varying float vAlpha;
         varying float vRotation;
   
         void main() {
           vec3 pos = position;
   
           float total  = uRangeY * 2.0;
           float fallen = uTime * aSpeed;
           pos.y = uRangeY - mod((uRangeY - pos.y) + fallen, total);
   
           pos.x += sin(uTime * 0.45 + aSeed) * aSway;
           pos.z += cos(uTime * 0.30 + aSeed * 0.7) * 0.4;
   
           vec4 mv = modelViewMatrix * vec4(pos, 1.0);
           gl_Position = projectionMatrix * mv;
   
           gl_PointSize = aSize * uPixelRatio * (250.0 / -mv.z);
   
           float relY = (pos.y + uRangeY) / total; 
           vAlpha = smoothstep(0.0, 0.22, relY) * smoothstep(1.0, 0.78, relY);
   
           vRotation = aPhase + uTime * aSpin;
         }
       `,
       fragmentShader: /* glsl */`
         uniform sampler2D uMap;
         varying float vAlpha;
         varying float vRotation;
   
         void main() {
           float c = cos(vRotation);
           float s = sin(vRotation);
           vec2 uv = gl_PointCoord - 0.5;
           uv = mat2(c, -s, s, c) * uv;
           uv += 0.5;
           if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
   
           vec4 tex = texture2D(uMap, uv);
           if (tex.a < 0.02) discard;
           
           // Slightly boosted opacity for the higher-res hearts
           gl_FragColor = vec4(tex.rgb, tex.a * vAlpha * 0.95);
         }
       `,
     });
   
     const points = new THREE.Points(geometry, material);
     points.name = 'FallingHearts';
     points.renderOrder = -1; 
     scene.add(points);
   
     function onResize() {
       material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
     }
     window.addEventListener('resize', onResize);
   
     function update(elapsed) {
       material.uniforms.uTime.value = elapsed;
     }
   
     function dispose() {
       window.removeEventListener('resize', onResize);
       geometry.dispose();
       material.dispose();
       texture.dispose();
       scene.remove(points);
     }
   
     return { points, update, dispose };
   }