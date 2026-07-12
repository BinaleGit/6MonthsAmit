/* =============================================================
   coupleAnimation.js
   Articulated glass figures jump infinitely on soft clouds.
   Every 18 jumps, they fluidly board a UFO for a slow, 
   smooth flight contained entirely within the screen.
   ============================================================= */

   import * as THREE from 'three';

   export function createCoupleAnimation(scene) {
     const group = new THREE.Group();
   
     // ---------- Mobile-friendly Orbit ----------
     const isMobile = window.matchMedia('(max-width: 768px)').matches;
     const xMulti = isMobile ? 0.4 : 1.0;
     
     group.scale.setScalar(isMobile ? 0.75 : 1.0);
   
     const radiusX = isMobile ? 2.2 : 4.0;
     const radiusZ = isMobile ? 3.2 : 4.0;
   
     group.position.set(0, 0, 0);
     scene.add(group);
   
     /* ---------- 1. Create the Fluffy Cloud Platforms ---------- */
     const cloudShape = new THREE.Shape();
     cloudShape.moveTo(0, 0);
     cloudShape.bezierCurveTo(0, -2, 4, -2, 4, 0);
     cloudShape.bezierCurveTo(7, 0, 7, 4, 4, 4);
     cloudShape.bezierCurveTo(4, 7, -2, 7, -2, 4);
     cloudShape.bezierCurveTo(-5, 4, -5, 0, -2, 0);
     cloudShape.bezierCurveTo(-2, -2, 0, -2, 0, 0);
   
     const extrudeSettings = { depth: 1.5, bevelEnabled: true, bevelSegments: isMobile ? 1 : 2, steps: 1, bevelSize: 0.5, bevelThickness: 0.5 };
     const cloudGeo = new THREE.ExtrudeGeometry(cloudShape, extrudeSettings);
     
     cloudGeo.computeBoundingBox();
     const center = new THREE.Vector3();
     cloudGeo.boundingBox.getCenter(center);
     cloudGeo.translate(-center.x, -center.y, -center.z);
     
     const baseCloudScale = 0.08; 
     const cloudMat = new THREE.MeshStandardMaterial({
       color: '#ffffff', emissive: '#c9a4ff', emissiveIntensity: 0.15, 
       metalness: 0.05, roughness: 0.6, transparent: true, opacity: 0.8
     });
   
     const numPlatforms = 8;
     const platforms = [];
     for (let i = 0; i < numPlatforms; i++) {
       const mesh = new THREE.Mesh(cloudGeo, cloudMat);
       group.add(mesh);
       platforms.push(mesh);
     }
   
     /* ---------- 2. Create the Spaceship UFO ---------- */
     const shipGroup = new THREE.Group();
     shipGroup.visible = false;
   
     const domeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 0.1 });
     const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, isMobile ? 8 : 16, isMobile ? 8 : 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
     
     const baseMat = new THREE.MeshStandardMaterial({ color: '#aaaaaa', metalness: 0.8, roughness: 0.2 });
     const shipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.4, 0.2, isMobile ? 16 : 32), baseMat);
     shipBase.position.y = -0.1;
     
     const ringMat = new THREE.MeshBasicMaterial({ color: '#c9a4ff' });
     const shipRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, isMobile ? 4 : 8, isMobile ? 16 : 32), ringMat);
     shipRing.rotation.x = Math.PI / 2;
     shipRing.position.y = -0.05;
   
     shipGroup.add(dome, shipBase, shipRing);
     group.add(shipGroup);
   
     /* ---------- 3. Orbit & Flight Engine ---------- */
     const jumpDuration = 1.6;
     const bumpMap = new Map(); 
   
     // Lengthened the cycle and the flight duration for a slower, smoother ride
     const CYCLE = 18;
     const FLIGHT_START = 12;
     const FLIGHT_END = 17; 
   
     function getOrbitPos(index) {
       const angle = index * 0.95; 
       return new THREE.Vector3(
         Math.cos(angle) * radiusX, 
         Math.sin(index * 1.2) * 1.2, 
         Math.sin(angle) * radiusZ
       );
     }
   
     // Calculates the continuous, real-time position of the spaceship
     function getShipGlobalPos(elapsed) {
       const cycleNum = Math.floor(elapsed / (CYCLE * jumpDuration));
       const localTime = elapsed % (CYCLE * jumpDuration);
       const localJump = localTime / jumpDuration;
   
       const tNorm = THREE.MathUtils.clamp((localJump - FLIGHT_START) / (FLIGHT_END - FLIGHT_START), 0, 1);
       const ease = tNorm < 0.5 ? 2 * tNorm * tNorm : 1 - Math.pow(-2 * tNorm + 2, 2) / 2;
   
       const startPos = getOrbitPos(cycleNum * CYCLE + FLIGHT_START);
       const endPos = getOrbitPos(cycleNum * CYCLE + FLIGHT_END);
   
       const pos = startPos.clone().lerp(endPos, ease);
   
       // Contained flight path - lower peak, tighter weave, keeps them on screen
       pos.y += Math.sin(ease * Math.PI) * 2.2;                 
       pos.x += Math.sin(ease * Math.PI * 2) * 1.5 * xMulti;    
       pos.z += Math.sin(ease * Math.PI) * 2.2;                 
   
       return pos;
     }
   
     function getLogicalPos(index) {
       const normCycle = ((index % CYCLE) + CYCLE) % CYCLE;
       if (normCycle >= FLIGHT_START && normCycle <= FLIGHT_END) {
         return getShipGlobalPos(index * jumpDuration);
       }
       return getOrbitPos(index);
     }
   
     function applyForce(index, force) {
       bumpMap.set(index, Math.max(bumpMap.get(index) || 0, force));
     }
   
     /* ---------- 4. Create the Articulated Figures ---------- */
     function createPerson(colorHex, isGirl) {
       const figGroup = new THREE.Group();
       const mat = new THREE.MeshStandardMaterial({ color: colorHex, transparent: true, opacity: 0.8, roughness: 0.2, emissive: colorHex, emissiveIntensity: 0.4 });
   
       const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, isMobile ? 8 : 12, isMobile ? 8 : 12), mat); head.position.y = 0.48;
       const torso = new THREE.Mesh(isGirl ? new THREE.ConeGeometry(0.1, 0.28, isMobile ? 8 : 12) : new THREE.CylinderGeometry(0.08, 0.05, 0.3, isMobile ? 8 : 12), mat);
       torso.position.y = isGirl ? 0.22 : 0.25;
       
       const legGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.2, isMobile ? 4 : 6); legGeo.translate(0, -0.1, 0); 
       const lLeg = new THREE.Mesh(legGeo, mat); lLeg.position.set(-0.04, 0.12, 0);
       const rLeg = new THREE.Mesh(legGeo, mat); rLeg.position.set(0.04, 0.12, 0);
   
       const armGeo = new THREE.CylinderGeometry(0.02, 0.015, 0.22, isMobile ? 4 : 6); armGeo.translate(0, -0.11, 0);
       const armX = isGirl ? 0.08 : 0.11; 
       const lArm = new THREE.Mesh(armGeo, mat); lArm.position.set(-armX, 0.36, 0);
       const rArm = new THREE.Mesh(armGeo, mat); rArm.position.set(armX, 0.36, 0);
   
       figGroup.add(torso, head, lLeg, rLeg, lArm, rArm);
       return { group: figGroup, torso, head, lLeg, rLeg, lArm, rArm, isGirl };
     }
   
     const girl = createPerson('#ffb3d1', true);  
     const boy = createPerson('#f6c478', false);  
     group.add(girl.group, boy.group);
   
     /* ---------- 5. Animation Blending Logic ---------- */
     const restRatio = 0.25; 
     const jumpHeight = 1.3;
   
     function updateFigure(person, elapsed, timeOffset) {
       const time = (elapsed + timeOffset) / jumpDuration;
       const currIndex = Math.floor(time);
       const nextIndex = currIndex + 1;
       const p = time - currIndex; 
       const normCycle = ((currIndex % CYCLE) + CYCLE) % CYCLE;
       
       const startPos = getLogicalPos(currIndex);
       const endPos = getLogicalPos(nextIndex);
   
       // Calculate fluid sit blending (0 = normal jump, 1 = perfectly seated in ship)
       let sitBlend = 0;
       if (normCycle >= FLIGHT_START && normCycle < FLIGHT_END) {
         sitBlend = 1.0;
       } else if (normCycle === FLIGHT_START - 1 && p >= restRatio) {
         sitBlend = (p - restRatio) / (1.0 - restRatio); // Boarding: smoothly morph into sitting mid-air
       } else if (normCycle === FLIGHT_END) {
         sitBlend = p < restRatio ? 1.0 : 1.0 - ((p - restRatio) / (1.0 - restRatio)); // Exiting: morph out of sitting
       }
   
       if (sitBlend === 0) {
         startPos.y -= (bumpMap.get(currIndex) || 0) * 0.25;
         endPos.y -= (bumpMap.get(nextIndex) || 0) * 0.25;
       }
   
       // 1. Calculate Standard Jump Pose
       let targetPos = new THREE.Vector3();
       let targetScale = new THREE.Vector3(1, 1, 1);
       let torsoRot = 0, lLegRot = 0, rLegRot = 0, lArmRot = 0, rArmRot = 0;
   
       if (p < restRatio) {
         const squash = Math.sin((p / restRatio) * Math.PI); 
         targetPos.copy(startPos);
         targetScale.set(1 + (squash * 0.15), 1 - (squash * 0.25), 1 + (squash * 0.15));
         lArmRot = rArmRot = -squash * 1.5;
         torsoRot = squash * 0.2;
         if (sitBlend === 0) applyForce(currIndex, squash * 0.4);
       } else {
         const airP = (p - restRatio) / (1.0 - restRatio); 
         targetPos.lerpVectors(startPos, endPos, airP);
         targetPos.y += Math.sin(airP * Math.PI) * jumpHeight;
         const stretch = Math.sin(airP * Math.PI);
         targetScale.set(1 - (stretch * 0.05), 1 + (stretch * 0.1), 1 - (stretch * 0.05));
         lArmRot = rArmRot = stretch * 2.8;
         lLegRot = rLegRot = stretch * 0.6;
         torsoRot = stretch * 0.4; 
         if (airP > 0.92 && sitBlend === 0) applyForce(nextIndex, (airP - 0.92) * 12);
       }
   
       // 2. Blend towards Sitting Pose if applicable
       if (sitBlend > 0) {
         const offsetMulti = person.isGirl ? -1 : 1;
         const localOffset = new THREE.Vector3(offsetMulti * 0.18, -0.05, 0).applyQuaternion(shipGroup.quaternion);
         const perfectSitPos = shipGroup.position.clone().add(localOffset);
   
         targetPos.lerpVectors(targetPos, perfectSitPos, sitBlend);
         targetScale.lerp(new THREE.Vector3(0.85, 0.85, 0.85), sitBlend);
         
         torsoRot = THREE.MathUtils.lerp(torsoRot, 0, sitBlend);
         lLegRot = THREE.MathUtils.lerp(lLegRot, -Math.PI / 1.8, sitBlend);
         rLegRot = THREE.MathUtils.lerp(rLegRot, -Math.PI / 1.8, sitBlend);
         
         const waveL = Math.PI - Math.sin(elapsed * 12) * 0.4;
         const waveR = Math.PI + Math.cos(elapsed * 12) * 0.4;
         lArmRot = THREE.MathUtils.lerp(lArmRot, waveL, sitBlend);
         rArmRot = THREE.MathUtils.lerp(rArmRot, waveR, sitBlend);
         
         person.group.quaternion.slerp(shipGroup.quaternion, sitBlend);
       } else {
         const lookTarget = new THREE.Vector3().copy(endPos);
         lookTarget.y = person.group.position.y; 
         const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
           new THREE.Matrix4().lookAt(person.group.position, lookTarget, new THREE.Vector3(0,1,0))
         );
         person.group.quaternion.slerp(targetQuat, 0.2); // Smooth looking while jumping
       }
   
       // Apply finalized math to the meshes
       person.group.position.copy(targetPos);
       person.group.scale.copy(targetScale);
       person.torso.rotation.x = torsoRot;
       person.lLeg.rotation.x = lLegRot;
       person.rLeg.rotation.x = rLegRot;
       person.lArm.rotation.x = lArmRot;
       person.rArm.rotation.x = rArmRot;
     }
   
     /* ---------- 6. Cloud Visibility Logic ---------- */
     function getCloudScale(logicalIndex, girlTime, boyTime) {
       const normCycle = ((logicalIndex % CYCLE) + CYCLE) % CYCLE;
       if (normCycle >= FLIGHT_START && normCycle < FLIGHT_END) return 0.0; 
   
       function checkChar(t) {
         const cIdx = Math.floor(t);
         const p = t - cIdx;
         if (logicalIndex === cIdx) {
           if (p < restRatio) return 1.0; 
           return Math.max(0, 1.0 - ((p - restRatio) / (1.0 - restRatio)) * 3.5); 
         } else if (logicalIndex === cIdx + 1) {
           if (p < restRatio) return 0.0;
           const airP = (p - restRatio) / (1.0 - restRatio);
           if (airP > 0.5) return 1.0 + Math.sin(((airP - 0.5) / 0.5) * Math.PI) * 0.25; 
         }
         return 0.0;
       }
       return Math.max(checkChar(girlTime), checkChar(boyTime));
     }
   
     /* ---------- 7. Main Update Loop ---------- */
     function update(elapsed) {
       for (let [idx, bump] of bumpMap.entries()) {
         const newBump = bump + (0 - bump) * 0.15;
         if (newBump < 0.01) bumpMap.delete(idx);
         else bumpMap.set(idx, newBump);
       }
   
       // Smooth Spaceship Movement
       const shipTime = (elapsed % (CYCLE * jumpDuration)) / jumpDuration;
       
       if (shipTime > FLIGHT_START - 2 && shipTime < FLIGHT_END + 2) {
         shipGroup.visible = true;
         const transitionIn = THREE.MathUtils.clamp(shipTime - (FLIGHT_START - 1.5), 0, 1);
         const transitionOut = THREE.MathUtils.clamp((FLIGHT_END + 1.5) - shipTime, 0, 1);
         shipGroup.scale.setScalar(Math.min(transitionIn, transitionOut) * (isMobile ? 0.9 : 1.1));
         
         const shipPos = getShipGlobalPos(elapsed);
         shipGroup.position.copy(shipPos);
         
         const prevPos = getShipGlobalPos(elapsed - 0.05);
         const vel = shipPos.clone().sub(prevPos);
         if (vel.lengthSq() > 0.0001) {
           const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
             new THREE.Matrix4().lookAt(shipGroup.position, shipPos.clone().add(vel), new THREE.Vector3(0,1,0))
           );
           shipGroup.quaternion.slerp(targetQuat, 0.1); // Smooth banking
         }
         shipRing.rotation.z -= 0.15;
       } else {
         shipGroup.visible = false;
       }
   
       updateFigure(girl, elapsed, 0);
       updateFigure(boy, elapsed, -0.45); 
   
       const girlTime = elapsed / jumpDuration;
       const boyTime = (elapsed - 0.45) / jumpDuration;
       const baseIndex = Math.floor(girlTime) - 2;
   
       for (let i = 0; i < numPlatforms; i++) {
         const logicalIndex = baseIndex + i;
         const pos = getOrbitPos(logicalIndex);
         
         const bump = bumpMap.get(logicalIndex) || 0;
         pos.y -= bump * 0.25;
         platforms[i].position.copy(pos);
         
         const targetScale = getCloudScale(logicalIndex, girlTime, boyTime);
         platforms[i].scale.setScalar(targetScale * (1.0 - Math.min(bump, 0.4)) * baseCloudScale);
         
         const seed = logicalIndex * 1.37;
         platforms[i].rotation.x = Math.sin(elapsed * 1.5 + seed) * 0.1;
         platforms[i].rotation.y = Math.cos(elapsed * 1.1 + seed) * 0.1;
         platforms[i].rotation.z = Math.sin(elapsed * 0.8 + seed) * 0.05;
       }
     }
   
     function dispose() {
       cloudGeo.dispose();
       cloudMat.dispose();
       domeMat.dispose();
       baseMat.dispose();
       ringMat.dispose();
       scene.remove(group);
     }
   
     return { update, dispose };
   }