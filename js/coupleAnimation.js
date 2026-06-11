/* =============================================================
   coupleAnimation.js
   Articulated glass figures jump infinitely upward on a sequence
   of falling hearts, creating an endless free-fall illusion.
   Includes bend anticipation, physical spring bumps, and landing impacts.
   ============================================================= */

   import * as THREE from 'three';

   export function createCoupleAnimation(scene) {
     const group = new THREE.Group();
     // Pushed back and centered so they sit deep inside the falling scene
     group.position.set(0, 0, -3); 
     scene.add(group);
   
     /* ---------- 1. Create the Bouncy Heart Platforms ---------- */
     const heartShape = new THREE.Shape();
     const x = 0, y = 0;
     heartShape.moveTo(x + 5, y + 5);
     heartShape.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
     heartShape.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
     heartShape.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
     heartShape.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
     heartShape.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
     heartShape.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
   
     const extrudeSettings = { depth: 2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 1, bevelThickness: 1 };
     const heartGeo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
     
     heartGeo.computeBoundingBox();
     const center = new THREE.Vector3();
     heartGeo.boundingBox.getCenter(center);
     heartGeo.translate(-center.x, -center.y, -center.z);
     
     const baseHeartScale = 0.025; 
     heartGeo.scale(baseHeartScale, baseHeartScale, baseHeartScale);
     heartGeo.rotateZ(Math.PI);
   
     const heartMat = new THREE.MeshPhysicalMaterial({
       color: '#ffb3d1', emissive: '#ff79c6', emissiveIntensity: 0.35, 
       metalness: 0.1, roughness: 0.15, transmission: 0.95, thickness: 0.8, transparent: true, opacity: 0.9
     });
   
     // A "sliding window" pool of meshes so the tower can fall infinitely without crashing
     const numPlatforms = 8;
     const platforms = [];
     for (let i = 0; i < numPlatforms; i++) {
       const mesh = new THREE.Mesh(heartGeo, heartMat);
       group.add(mesh);
       platforms.push(mesh);
     }
   
     /* ---------- 2. Falling Logic Parameters ---------- */
     const verticalSpacing = 3.0;
     const jumpDuration = 1.6;
     const fallSpeed = verticalSpacing / jumpDuration; // Locks the fall speed to their jump rhythm
     const bumpMap = new Map(); // Tracks the physical bounce state of every individual heart
   
     function getLogicalPlatformPos(index, elapsed) {
       // Math logic creates a staggering left/right path
       const seed = index * 1.37;
       const pX = Math.sin(seed) * 2.2;
       const pZ = Math.cos(seed * 1.1) * 1.5;
       
       // The core illusion: Y falls linearly over time
       const pY = (index * verticalSpacing) - (elapsed * fallSpeed);
       return new THREE.Vector3(pX, pY, pZ);
     }
   
     function applyForce(index, force) {
       const current = bumpMap.get(index) || 0;
       bumpMap.set(index, Math.max(current, force));
     }
   
     /* ---------- 3. Create the Articulated Figures ---------- */
     function createPerson(colorHex, isGirl) {
       const figGroup = new THREE.Group();
       
       const mat = new THREE.MeshPhysicalMaterial({
         color: colorHex, transmission: 0.8, roughness: 0.2, 
         emissive: colorHex, emissiveIntensity: 0.4
       });
   
       const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), mat);
       head.position.y = 0.48;
   
       let torso;
       if (isGirl) {
         torso = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.28, 16), mat);
         torso.position.y = 0.22;
       } else {
         torso = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.3, 16), mat);
         torso.position.y = 0.25;
       }
       
       const legGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.2, 8);
       legGeo.translate(0, -0.1, 0); 
       const lLeg = new THREE.Mesh(legGeo, mat); lLeg.position.set(-0.04, 0.12, 0);
       const rLeg = new THREE.Mesh(legGeo, mat); rLeg.position.set(0.04, 0.12, 0);
   
       const armGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.22, 8);
       armGeo.translate(0, -0.11, 0);
       
       const armX = isGirl ? 0.08 : 0.11; 
       const lArm = new THREE.Mesh(armGeo, mat); lArm.position.set(-armX, 0.36, 0);
       const rArm = new THREE.Mesh(armGeo, mat); rArm.position.set(armX, 0.36, 0);
   
       figGroup.add(torso, head, lLeg, rLeg, lArm, rArm);
       
       return { group: figGroup, torso, head, lLeg, rLeg, lArm, rArm };
     }
   
     const girl = createPerson('#ffb3d1', true);  
     const boy = createPerson('#f6c478', false);  
     group.add(girl.group, boy.group);
   
     /* ---------- 4. Animation Frame Logic ---------- */
     const restRatio = 0.25; 
     const jumpHeight = 1.3;
   
     function updateFigure(person, elapsed, timeOffset) {
       const time = (elapsed + timeOffset) / jumpDuration;
       const currIndex = Math.floor(time);
       const nextIndex = currIndex + 1;
       const p = time % 1.0; 
   
       // Look up where their target platforms currently are in physical space
       const startPos = getLogicalPlatformPos(currIndex, elapsed);
       const endPos = getLogicalPlatformPos(nextIndex, elapsed);
   
       // Apply the bouncy physics
       startPos.y -= (bumpMap.get(currIndex) || 0) * 0.25;
       endPos.y -= (bumpMap.get(nextIndex) || 0) * 0.25;
   
       const lookTarget = new THREE.Vector3().copy(endPos);
       lookTarget.y = person.group.position.y; 
       person.group.lookAt(lookTarget);
   
       if (p < restRatio) {
         // --- GROUND PHASE (Squatting down while the platform falls) ---
         const bendProgress = p / restRatio; 
         const squash = Math.sin(bendProgress * Math.PI); 
         
         person.group.position.copy(startPos);
         person.group.scale.set(1 + (squash * 0.15), 1 - (squash * 0.25), 1 + (squash * 0.15));
         
         person.lArm.rotation.x = -squash * 1.5;
         person.rArm.rotation.x = -squash * 1.5;
         person.lLeg.rotation.x = 0;
         person.rLeg.rotation.x = 0;
         person.torso.rotation.x = squash * 0.2;
         
         // Press the heart down with their weight
         applyForce(currIndex, squash * 0.4);
   
       } else {
         // --- AIR PHASE (Leaping upward to catch the next falling platform) ---
         const airP = (p - restRatio) / (1.0 - restRatio); 
         
         person.group.position.lerpVectors(startPos, endPos, airP);
         
         const arc = Math.sin(airP * Math.PI) * jumpHeight;
         person.group.position.y += arc;
         
         const stretch = Math.sin(airP * Math.PI);
         person.group.scale.set(1 - (stretch * 0.05), 1 + (stretch * 0.1), 1 - (stretch * 0.05));
         
         person.lArm.rotation.x = stretch * 2.8;
         person.rArm.rotation.x = stretch * 2.8;
         person.lLeg.rotation.x = stretch * 0.6;
         person.rLeg.rotation.x = stretch * 0.6;
         person.torso.rotation.x = stretch * 0.4; 
         
         // Hard landing impacts the next heart
         if (airP > 0.92) {
           applyForce(nextIndex, (airP - 0.92) * 12);
         }
       }
     }
   
     function update(elapsed) {
       // Gently pan the entire system slightly side to side for organic motion
       group.rotation.y = Math.sin(elapsed * 0.2) * 0.15;
   
       // 1. Resolve physics bumps (springs snapping back)
       for (let [idx, bump] of bumpMap.entries()) {
         const newBump = bump + (0 - bump) * 0.15;
         if (newBump < 0.01) {
           bumpMap.delete(idx);
         } else {
           bumpMap.set(idx, newBump);
         }
       }
   
       // 2. Animate Characters (Boy is perfectly delayed to chase from below)
       updateFigure(girl, elapsed, 0);
       updateFigure(boy, elapsed, -0.45); 
   
       // 3. Render the sliding window of visual platforms
       const baseIndex = Math.floor(elapsed / jumpDuration) - 2;
       for (let i = 0; i < numPlatforms; i++) {
         const logicalIndex = baseIndex + i;
         const pos = getLogicalPlatformPos(logicalIndex, elapsed);
         
         const bump = bumpMap.get(logicalIndex) || 0;
         pos.y -= bump * 0.25;
         
         platforms[i].position.copy(pos);
         platforms[i].scale.setScalar(baseHeartScale * (1.0 - Math.min(bump, 0.6)));
         
         const seed = logicalIndex * 1.37;
         platforms[i].rotation.x = -Math.PI / 2.2;
         platforms[i].rotation.z = Math.sin(seed) * 0.3;
       }
     }
   
     function dispose() {
       heartGeo.dispose();
       heartMat.dispose();
       scene.remove(group);
     }
   
     return { update, dispose };
   }