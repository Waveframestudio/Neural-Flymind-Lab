import React, { useEffect, useRef } from 'react';
import { BRAIN } from '../connectome';
import { evaluateBehaviorEntry, normalizeAngle } from '../fly-logic';
import { bioAudio } from '../services/bioAudio';

export default function FlyCanvas({
  activeTool,
  lightState,
  tempState,
  setDrives,
  setNodeActivations,
  onLogAction,
  onUpdateCaretakerState,
}) {
  const canvasRef = useRef(null);

  const simRef = useRef({
    fly: {
      x: 0,
      y: 0,
      facingDir: 0,
      speed: 0,
      targetSpeed: 0,
      targetDir: 0,
    },
    food: [],
    ripples: [],
    windArrowEnd: null,
    isDraggingWind: false,
    dragStart: { x: 0, y: 0 },
    touchTimestamps: [],
    touchResetTime: 0,
    windResetTime: 0,
    zoomLevel: 1,
    panX: 0,
    panY: 0,
    behavior: {
      current: 'idle',
      enterTime: Date.now(),
      cooldowns: {},
      startlePhase: 'none',
      startleFreezeEnd: 0,
      groomLocation: 'thorax',
      burstDir: 0,
    },
    anim: {
      walkPhase: 0,
      antennaTwitchL: 0,
      antennaTwitchR: 0,
      antennaTargetL: 0,
      antennaTargetR: 0,
      antennaTimer: 0,
      legJitter: [0, 0, 0, 0, 0, 0],
      legJitterTarget: [0, 0, 0, 0, 0, 0],
      legJitterTimer: 0,
      wingMicro: 0,
      wingMicroTarget: 0,
      wingMicroTimer: 0,
      antennaNextInterval: 1.0,
      legJitterNextInterval: 2.0,
      wingMicroNextInterval: 2.5,
      groomPhase: 0,
      proboscisExtend: 0,
      wingSpread: 0,
      warmAlpha: 0,
      coolAlpha: 0,
      darkAlpha: 0,
    },
  });

  const screenToWorld = (sx, sy) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: sx, y: sy };
    const rect = canvas.getBoundingClientRect();
    const clientX = sx - rect.left;
    const clientY = sy - rect.top;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const state = simRef.current;
    return {
      x: (clientX - cx - state.panX) / state.zoomLevel + cx,
      y: (clientY - cy - state.panY) / state.zoomLevel + cy,
    };
  };

  const nearestFood = () => {
    const { fly, food } = simRef.current;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < food.length; i++) {
      const d = Math.hypot(fly.x - food[i].x, fly.y - food[i].y);
      if (d < bestDist) {
        bestDist = d;
        best = food[i];
      }
    }
    return best ? { item: best, dist: bestDist } : null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const sim = simRef.current;
      if (sim.fly.x === 0 || sim.fly.y === 0) {
        sim.fly.x = canvas.width / 2;
        sim.fly.y = (canvas.height - 180) / 2;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    if (!BRAIN.drives) {
      BRAIN.drives = { hunger: 0.1, fear: 0.0, fatigue: 0.1, curiosity: 0.5, groom: 0.0 };
    }
    if (!BRAIN.stimulate) {
      BRAIN.stimulate = {
        touch: false,
        touchLocation: null,
        wind: false,
        windStrength: 0,
        windDirection: 0,
        foodNearby: false,
        foodContact: false,
        nociception: false,
        lightLevel: 1.0,
        temperature: 0.5,
      };
    }

    let animId;
    let lastTime = performance.now();

    const BODY = {
      headRadius: 6,
      headOffsetY: -24,
      eyeRadiusX: 4,
      eyeRadiusY: 5,
      eyeOffsetX: 5.5,
      eyeOffsetY: -25,
      antennaBaseX: 2.5,
      antennaBaseY: -29,
      antennaLength: 10,
      antennaBulbRadius: 1.5,
      thoraxRadiusX: 8,
      thoraxRadiusY: 12,
      thoraxOffsetY: -10,
      abdomenRadiusX: 10,
      abdomenRadiusY: 16,
      abdomenOffsetY: 12,
      wingOffsetX: 7,
      wingOffsetY: -8,
      wingLength: 42,
      wingWidth: 16,
      proboscisLength: 8,
      proboscisBaseY: -30,
      legAttach: [{ x: 7, y: -16 }, { x: 9, y: -10 }, { x: 8, y: -3 }],
      legSeg1: 8,
      legSeg2: 10,
      legSeg3: 6,
      legRestAngles: [{ hip: -0.7, knee: -0.3 }, { hip: 0.0, knee: 0.2 }, { hip: 0.7, knee: 0.3 }],
    };

    const COLORS = {
      thorax: '#8d5b30',
      thoraxStroke: '#4a2c11',
      abdomen: '#a16d3b',
      abdomenStripe: '#361d0b',
      abdomenLight: '#c28b52',
      head: '#a16d3b',
      headStroke: '#4a2c11',
      eyeFill: '#ef4444',
      eyeHighlight: '#fca5a5',
      antenna: '#e2b887',
      antennaBulb: '#c4935a',
      leg: '#b37c47',
      legJoint: '#66401e',
      proboscis: '#e2b887',
    };

    const loop = (now) => {
      animId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      const dtScale = dt * 60;
      lastTime = now;

      const sim = simRef.current;
      const { fly, behavior, anim, food, ripples } = sim;

      if (fly.x === 0 || fly.y === 0 || isNaN(fly.x) || isNaN(fly.y)) {
        fly.x = canvas.width / 2;
        fly.y = (canvas.height - 180) / 2;
        fly.facingDir = 0;
      }

      if (sim.touchResetTime > 0 && Date.now() > sim.touchResetTime) {
        BRAIN.stimulate.touch = false;
        BRAIN.stimulate.touchLocation = null;
        sim.touchResetTime = 0;
      }
      if (sim.windResetTime > 0 && Date.now() > sim.windResetTime) {
        BRAIN.stimulate.wind = false;
        BRAIN.stimulate.windStrength = 0;
        sim.windResetTime = 0;
      }

      const nf = nearestFood();
      BRAIN.stimulate.foodNearby = nf !== null && nf.dist < 200;
      BRAIN.stimulate.foodContact = nf !== null && nf.dist < 25;

      if (BRAIN.update) {
        BRAIN.update();
      }

      const nodeActs = {};
      if (BRAIN.postSynaptic) {
        for (const k in BRAIN.postSynaptic) {
          if (BRAIN.postSynaptic[k]) {
            nodeActs[k] = BRAIN.postSynaptic[k][BRAIN.nextState] || 0;
          }
        }
      }

      const nextBehavior = evaluateBehaviorEntry(behavior, food, fly);
      if (nextBehavior !== behavior.current) {
        behavior.current = nextBehavior;
        behavior.enterTime = Date.now();
        if (nextBehavior === 'startle') {
          behavior.startlePhase = 'freeze';
          behavior.startleFreezeEnd = Date.now() + 150;
        } else {
          behavior.startlePhase = 'none';
        }
        if (nextBehavior === 'groom') {
          behavior.groomLocation = BRAIN.stimulate.touchLocation || 'thorax';
        }
      }

      // Handle Air / Wind stimulus physically pushing fly
      if (BRAIN.stimulate.wind && (sim.isDraggingWind || (sim.windResetTime && Date.now() < sim.windResetTime))) {
        const windDir = BRAIN.stimulate.windDirection || 0;
        const str = BRAIN.stimulate.windStrength || 0.6;
        const windSpeed = str * 4.2;
        fly.x += Math.cos(windDir) * windSpeed * dtScale;
        fly.y += Math.sin(windDir) * windSpeed * dtScale;
        fly.targetDir = normalizeAngle(windDir + Math.PI + (Math.random() - 0.5) * 0.4);
        fly.targetSpeed = 3.5;
        anim.wingSpread = Math.min(1.0, anim.wingSpread + 0.2);
      }

      if (behavior.current === 'startle') {
        if (behavior.startlePhase === 'freeze') {
          fly.speed = 0;
          if (Date.now() >= behavior.startleFreezeEnd) {
            behavior.startlePhase = 'burst';
            fly.speed = 4.8;
            behavior.burstDir = normalizeAngle(fly.facingDir + Math.PI + (Math.random() - 0.5) * 0.5);
            fly.targetDir = behavior.burstDir;
            fly.facingDir = behavior.burstDir;
          }
        } else {
          fly.speed += (1.0 - fly.speed) * 0.1;
        }
      } else if (behavior.current === 'walk' || behavior.current === 'explore' || behavior.current === 'phototaxis' || behavior.current === 'idle') {
        const accumL = BRAIN.accumleft || 0;
        const accumR = BRAIN.accumright || 0;
        const turn = (accumL - accumR) / 20;
        fly.targetDir = fly.facingDir + Math.max(-0.12, Math.min(0.12, turn)) * Math.PI;
        fly.targetSpeed = behavior.current === 'idle' ? 1.6 : 2.4;
        fly.targetDir += (Math.random() - 0.5) * 0.28;

        if (BRAIN.stimulate.foodNearby && nf) {
          const foodAngle = Math.atan2(nf.item.y - fly.y, nf.item.x - fly.x);
          fly.targetDir = foodAngle;
          fly.targetSpeed = 2.6;
        }
      } else if (behavior.current === 'fly') {
        fly.targetDir = fly.facingDir + (Math.random() - 0.5) * 0.5;
        fly.targetSpeed = 4.2;
      } else if (behavior.current === 'feed') {
        if (nf && nf.dist > 15) {
          fly.targetDir = Math.atan2(nf.item.y - fly.y, nf.item.x - fly.x);
          fly.targetSpeed = 0.8;
        } else {
          fly.targetSpeed = 0.1;
        }
        if (nf && nf.dist <= 30) {
          nf.item.eaten = (nf.item.eaten || 0) + 0.01;
          BRAIN.drives.hunger = Math.max(0, BRAIN.drives.hunger - 0.005);
          if (Math.random() < 0.25) bioAudio.playFeedingSuction();
          if (nf.item.eaten >= 1) {
            sim.food = sim.food.filter((f) => f !== nf.item);
          }
        }
      } else if (behavior.current === 'groom') {
        fly.targetSpeed = 0.05;
      } else if (behavior.current === 'brace') {
        fly.targetSpeed = 0.2;
        fly.targetDir = normalizeAngle((BRAIN.stimulate.windDirection || 0) + Math.PI);
      } else {
        fly.targetSpeed = 0.4;
      }

      // Update Bio-Audio Wing Buzz Engine
      const isFlyingNow = behavior.current === 'fly' || (behavior.current === 'startle' && behavior.startlePhase === 'burst') || BRAIN.stimulate.wind;
      bioAudio.updateWingBuzz(isFlyingNow, fly.speed);

      // Random Neural Spike Clicks (Geiger / Bio-Electric style)
      if (Math.random() < (behavior.current === 'startle' ? 0.35 : 0.04)) {
        bioAudio.playNeuralClick();
      }

      if (isNaN(fly.targetDir)) fly.targetDir = fly.facingDir;
      const angleDiff = normalizeAngle(fly.targetDir - fly.facingDir);
      fly.facingDir += angleDiff * Math.min(1, 0.25 * dtScale);
      fly.speed += (fly.targetSpeed - fly.speed) * Math.min(1, 0.2 * dtScale);

      if (!isNaN(fly.facingDir) && !isNaN(fly.speed)) {
        fly.x += Math.cos(fly.facingDir) * fly.speed * dtScale * 2.2;
        fly.y += Math.sin(fly.facingDir) * fly.speed * dtScale * 2.2;
      }

      // Screen boundaries (smooth bounce-back turn into canvas)
      // Left panel: 300px, Right panel: 300px, Bottom panel: 180px
      const minX = 320;
      const maxX = canvas.width - 320;
      const minY = 70;
      const maxY = canvas.height - 210;

      if (fly.x < minX) { fly.x = minX; fly.targetDir = 0 + (Math.random() - 0.5) * 0.6; fly.facingDir = fly.targetDir; }
      if (fly.x > maxX) { fly.x = maxX; fly.targetDir = Math.PI + (Math.random() - 0.5) * 0.6; fly.facingDir = fly.targetDir; }
      if (fly.y < minY) { fly.y = minY; fly.targetDir = Math.PI / 2 + (Math.random() - 0.5) * 0.6; fly.facingDir = fly.targetDir; }
      if (fly.y > maxY) { fly.y = maxY; fly.targetDir = -Math.PI / 2 + (Math.random() - 0.5) * 0.6; fly.facingDir = fly.targetDir; }

      const targetWing = behavior.current === 'fly' || (behavior.current === 'startle' && behavior.startlePhase === 'burst') || BRAIN.stimulate.wind ? 1 : 0;
      anim.wingSpread += (targetWing - anim.wingSpread) * 0.15;
      anim.wingFlapPhase = (anim.wingFlapPhase || 0) + 1.2 * dtScale;

      const targetProboscis = behavior.current === 'feed' ? 1 : 0;
      anim.proboscisExtend += (targetProboscis - anim.proboscisExtend) * 0.15;

      if (behavior.current === 'groom') anim.groomPhase += 0.15 * dtScale;
      if (fly.speed > 0.02) {
        anim.walkPhase += Math.max(0.05, fly.speed * 0.25) * dtScale;
      }

      BRAIN.drives.hunger = Math.min(1.0, BRAIN.drives.hunger + 0.00015 * dtScale);
      BRAIN.drives.fear = Math.max(0.0, BRAIN.drives.fear * Math.pow(0.975, dtScale));
      
      const isResting = behavior.current === 'rest' || behavior.current === 'idle';
      if (isResting) {
        BRAIN.drives.fatigue = Math.max(0.0, BRAIN.drives.fatigue - 0.003 * dtScale);
      } else {
        BRAIN.drives.fatigue = Math.min(1.0, BRAIN.drives.fatigue + 0.0015 * dtScale);
      }
      BRAIN._isResting = isResting;
      BRAIN._currentBehavior = behavior.current;
      BRAIN.drives.groom = behavior.current === 'groom' ? Math.max(0, BRAIN.drives.groom - 0.02 * dtScale) : BRAIN.drives.groom;

      setDrives({
        behaviorState: behavior.current,
        hunger: BRAIN.drives.hunger,
        fear: BRAIN.drives.fear,
        fatigue: BRAIN.drives.fatigue,
        curiosity: BRAIN.drives.curiosity,
        groom: BRAIN.drives.groom,
      });
      setNodeActivations(nodeActs);
      onUpdateCaretakerState({ drives: BRAIN.drives, behaviorState: behavior.current, food: sim.food });

      // Render Lighter Slate Bio-Lab Canvas Background for optimal contrast
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw lab grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let gx = 0; gx < canvas.width; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
      }
      for (let gy = 0; gy < canvas.height; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
      }

      // Draw Petri Dish Arena Outer Glow Ring & Translucent Light Arena Field
      const availableWidth = canvas.width - 600;
      const availableHeight = canvas.height - 180;
      const cx = 300 + availableWidth / 2;
      const cy = availableHeight / 2;
      const dishRadius = Math.min(availableWidth, availableHeight) * 0.42;

      ctx.beginPath();
      ctx.arc(cx, cy, dishRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(cx + sim.panX, cy + sim.panY);
      ctx.scale(sim.zoomLevel, sim.zoomLevel);
      ctx.translate(-cx, -cy);

      // Smooth Light / Circadian Atmosphere Transition
      const currentLight = lightStateRef.current;
      const targetDarkAlpha = currentLight === 'dim' ? 0.35 : currentLight === 'dark' ? 0.75 : 0;
      anim.darkAlpha += (targetDarkAlpha - anim.darkAlpha) * Math.min(1, 0.05 * dtScale);

      if (anim.darkAlpha > 0.001) {
        ctx.fillStyle = `rgba(0, 0, 0, ${anim.darkAlpha})`;
        ctx.fillRect(-10000, -10000, 20000, 20000);
      }

      // Smooth Temperature Atmosphere Transitions (heat & frost fade-in / fade-out)
      const currentTemp = tempStateRef.current;
      const targetWarm = currentTemp === 'warm' ? 1 : 0;
      const targetCool = currentTemp === 'cool' ? 1 : 0;

      anim.warmAlpha += (targetWarm - anim.warmAlpha) * Math.min(1, 0.05 * dtScale);
      anim.coolAlpha += (targetCool - anim.coolAlpha) * Math.min(1, 0.05 * dtScale);

      if (anim.warmAlpha > 0.001) {
        // Hot / Thermal Heatwave Atmosphere Overlay
        const warmGrad = ctx.createRadialGradient(cx, cy, dishRadius * 0.2, cx, cy, dishRadius * 1.5);
        const heatPulse = Math.sin(now * 0.003) * 0.05;
        const a = anim.warmAlpha;
        warmGrad.addColorStop(0, `rgba(249, 115, 22, ${(0.12 + heatPulse) * a})`);
        warmGrad.addColorStop(0.6, `rgba(239, 68, 68, ${(0.1 + heatPulse * 0.8) * a})`);
        warmGrad.addColorStop(1, `rgba(185, 28, 28, ${0.22 * a})`);
        ctx.fillStyle = warmGrad;
        ctx.fillRect(-10000, -10000, 20000, 20000);
      }

      if (anim.coolAlpha > 0.001) {
        // Cold / Cryo Frost Vignette Atmosphere Overlay
        const coolGrad = ctx.createRadialGradient(cx, cy, dishRadius * 0.3, cx, cy, dishRadius * 1.6);
        const frostPulse = Math.cos(now * 0.0025) * 0.04;
        const a = anim.coolAlpha;
        coolGrad.addColorStop(0, `rgba(56, 189, 248, ${(0.08 + frostPulse) * a})`);
        coolGrad.addColorStop(0.65, `rgba(14, 165, 233, ${(0.16 + frostPulse) * a})`);
        coolGrad.addColorStop(1, `rgba(3, 105, 161, ${0.38 * a})`);
        ctx.fillStyle = coolGrad;
        ctx.fillRect(-10000, -10000, 20000, 20000);
      }

      // Draw Ripples (Touch stimulus effect)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        const age = (Date.now() - r.startTime) / 1000;
        if (age > 1.0) {
          ripples.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, age * 70, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${1 - age})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Draw Food (Glowing Emerald dots)
      food.forEach((f) => {
        const radius = 11 * (1 - (f.eaten || 0) * 0.7);
        ctx.beginPath();
        ctx.arc(f.x, f.y, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(f.x, f.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80';
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw Wind Drag Arrow and Streamlines
      if ((sim.isDraggingWind || BRAIN.stimulate.wind) && sim.windArrowEnd) {
        ctx.beginPath();
        ctx.moveTo(sim.dragStart.x, sim.dragStart.y);
        ctx.lineTo(sim.windArrowEnd.x, sim.windArrowEnd.y);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Arrow tip
        const arrowAngle = Math.atan2(sim.windArrowEnd.y - sim.dragStart.y, sim.windArrowEnd.x - sim.dragStart.x);
        ctx.beginPath();
        ctx.moveTo(sim.windArrowEnd.x, sim.windArrowEnd.y);
        ctx.lineTo(sim.windArrowEnd.x - 12 * Math.cos(arrowAngle - 0.4), sim.windArrowEnd.y - 12 * Math.sin(arrowAngle - 0.4));
        ctx.lineTo(sim.windArrowEnd.x - 12 * Math.cos(arrowAngle + 0.4), sim.windArrowEnd.y - 12 * Math.sin(arrowAngle + 0.4));
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }

      // Full Drosophila Fly Vector Art (Scaled 2.0x for clear visibility)
      const isEatingFood = behavior.current === 'feed';
      const feedingBobX = isEatingFood ? Math.cos(now * 0.02) * 1.2 : 0;
      const feedingBobY = isEatingFood ? Math.sin(now * 0.03) * 1.5 : 0;

      ctx.save();
      ctx.translate(fly.x + feedingBobX, fly.y + feedingBobY);
      ctx.rotate(fly.facingDir + Math.PI / 2);
      ctx.scale(2.0, 2.0);

      // Legs (behind body)
      for (let legIdx = 0; legIdx < 6; legIdx++) {
        const pairIdx = Math.floor(legIdx / 2);
        const side = legIdx % 2 === 0 ? -1 : 1;
        const attach = BODY.legAttach[pairIdx];
        const restAngles = BODY.legRestAngles[pairIdx];

        let hipMod = restAngles.hip;
        let kneeMod = restAngles.knee;
        let walkOffset = 0;

        const isMoving = fly.speed > 0.05 || behavior.current === 'walk' || behavior.current === 'explore' || behavior.current === 'phototaxis' || behavior.current === 'rest' || behavior.current === 'idle';
        if (isMoving && fly.speed > 0.02) {
          const inGroupA = [0, 3, 4].indexOf(legIdx) !== -1;
          const legPhase = anim.walkPhase + (inGroupA ? 0 : Math.PI);
          walkOffset = Math.sin(legPhase) * Math.min(0.35, Math.max(0.12, fly.speed * 0.25));
        } else if (behavior.current === 'groom') {
          // Multi-stage grooming routine: 1. Head/Eye rub, 2. Antenna stroke, 3. Wing flick/clean, 4. Abdomen stroke
          const groomStage = Math.floor((now / 1500) % 4);
          const rubFast = Math.sin(now * 0.04) * 0.45;
          const rubAlt = Math.cos(now * 0.035) * 0.35;

          if (groomStage === 0 && (legIdx === 0 || legIdx === 1)) {
            // Front legs rubbing head & compound eyes
            hipMod = -1.25 + rubFast;
            kneeMod = -0.85 + rubAlt;
          } else if (groomStage === 1 && (legIdx === 0 || legIdx === 1)) {
            // Alternate front legs stroking antennae
            const isLeft = legIdx === 0;
            hipMod = -1.4 + (isLeft ? rubFast * 0.6 : 0);
            kneeMod = -0.6 + (isLeft ? rubAlt * 0.5 : 0);
          } else if (groomStage === 2 && (legIdx === 2 || legIdx === 3)) {
            // Middle legs cleaning wings / thorax
            hipMod = 0.2 + rubFast * 0.5;
            kneeMod = 0.4 + rubAlt * 0.4;
          } else if (groomStage === 3 && (legIdx === 4 || legIdx === 5)) {
            // Back legs rubbing abdomen & hindgut
            hipMod = 1.15 + rubFast;
            kneeMod = 0.65 + rubAlt;
          }
        }

        const hipAngle = (hipMod + walkOffset) * side;
        const kneeAngle = kneeMod * side;

        const ax = attach.x * side;
        const ay = attach.y;

        const baseAngle = (side === -1 ? Math.PI : 0) + hipAngle;
        const seg1EndX = ax + Math.cos(baseAngle) * BODY.legSeg1;
        const seg1EndY = ay + Math.sin(baseAngle) * BODY.legSeg1;

        const kneeAngleAbs = baseAngle + kneeAngle + side * 0.5;
        const seg2EndX = seg1EndX + Math.cos(kneeAngleAbs) * BODY.legSeg2;
        const seg2EndY = seg1EndY + Math.sin(kneeAngleAbs) * BODY.legSeg2;

        const tarsusAngle = kneeAngleAbs + side * 0.3;
        const seg3EndX = seg2EndX + Math.cos(tarsusAngle) * BODY.legSeg3;
        const seg3EndY = seg2EndY + Math.sin(tarsusAngle) * BODY.legSeg3;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(seg1EndX, seg1EndY);
        ctx.lineTo(seg2EndX, seg2EndY);
        ctx.lineTo(seg3EndX, seg3EndY);
        ctx.strokeStyle = COLORS.leg;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(seg1EndX, seg1EndY, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.legJoint;
        ctx.fill();
      }

      // Abdomen (With organic breathing pulsation)
      const breathPulse = Math.sin(now * 0.006) * 0.7;
      ctx.beginPath();
      ctx.ellipse(0, BODY.abdomenOffsetY + breathPulse * 0.5, BODY.abdomenRadiusX + breathPulse * 0.4, BODY.abdomenRadiusY + breathPulse * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.abdomen;
      ctx.fill();

      // Abdomen Stripes
      for (let s = 0; s < 4; s++) {
        const stripeY = BODY.abdomenOffsetY + breathPulse * 0.5 - BODY.abdomenRadiusY * 0.3 + s * (BODY.abdomenRadiusY * 0.45);
        ctx.beginPath();
        ctx.ellipse(0, stripeY, (BODY.abdomenRadiusX + breathPulse * 0.4) * 0.9, BODY.abdomenRadiusY * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.abdomenStripe;
        ctx.fill();
      }

      // Wings (With periodic wing-flick / twitch during rest or grooming)
      const isWingFlicking = (behavior.current === 'idle' || behavior.current === 'groom') && Math.sin(now * 0.002) > 0.94;
      const isFlapping = anim.wingSpread > 0.1 || behavior.current === 'fly' || behavior.current === 'startle' || BRAIN.stimulate.wind || sim.isDraggingWind;
      const flapAngle = isFlapping ? Math.sin(now * 0.04) * 0.45 : (isWingFlicking ? Math.sin(now * 0.05) * 0.25 : 0);
      const baseSpread = anim.wingSpread * 0.7 + (isWingFlicking ? 0.2 : 0);

      [-1, 1].forEach((side) => {
        const totalAngle = side * (0.3 + baseSpread + (isFlapping ? 0.25 : 0)) + flapAngle * side;
        ctx.save();
        ctx.translate(BODY.wingOffsetX * side, BODY.wingOffsetY);
        ctx.rotate(totalAngle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(BODY.wingWidth * 1.2 * side, BODY.wingLength * 0.2, BODY.wingWidth * 1.4 * side, BODY.wingLength * 0.7, BODY.wingWidth * 0.3 * side, BODY.wingLength);
        ctx.bezierCurveTo(-BODY.wingWidth * 0.2 * side, BODY.wingLength * 0.8, -BODY.wingWidth * 0.1 * side, BODY.wingLength * 0.3, 0, 0);
        ctx.fillStyle = isFlapping ? 'rgba(224, 242, 254, 0.75)' : 'rgba(200, 210, 230, 0.45)';
        ctx.fill();
        ctx.strokeStyle = isFlapping ? '#38bdf8' : 'rgba(160, 170, 190, 0.6)';
        ctx.lineWidth = isFlapping ? 1.2 : 0.6;
        ctx.stroke();
        ctx.restore();
      });

      // Thorax
      ctx.beginPath();
      ctx.ellipse(0, BODY.thoraxOffsetY, BODY.thoraxRadiusX, BODY.thoraxRadiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.thorax;
      ctx.fill();
      ctx.strokeStyle = COLORS.thoraxStroke;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Head (With natural idle head-turns & curious tilts)
      const headTilt = (behavior.current === 'idle' || behavior.current === 'explore') ? Math.sin(now * 0.004) * 0.18 : 0;
      ctx.save();
      ctx.translate(0, BODY.headOffsetY);
      ctx.rotate(headTilt);

      ctx.beginPath();
      ctx.ellipse(0, 0, BODY.headRadius * 1.1, BODY.headRadius, 0, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.head;
      ctx.fill();

      // Compound Eyes (Red with highlight)
      [-1, 1].forEach((side) => {
        const ex = BODY.eyeOffsetX * side;
        const ey = 0;
        ctx.beginPath();
        ctx.ellipse(ex, ey, BODY.eyeRadiusX, BODY.eyeRadiusY, side * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.eyeFill;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(ex - side, ey - 1.5, BODY.eyeRadiusX * 0.4, BODY.eyeRadiusY * 0.35, side * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.eyeHighlight;
        ctx.fill();
      });

      // Antennae (With micro-twitches and tactile exploration vibration)
      const antennaTwitch = Math.sin(now * 0.015) * 0.15 + (behavior.current === 'explore' ? Math.cos(now * 0.04) * 0.25 : 0);
      [-1, 1].forEach((side) => {
        const bx = BODY.antennaBaseX * side;
        const by = -4;
        const tipX = bx + side * (4 + antennaTwitch * 6);
        const tipY = by - 8 + antennaTwitch * 4;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = COLORS.antenna;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(tipX, tipY, BODY.antennaBulbRadius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.antennaBulb;
        ctx.fill();
      });

      // Proboscis (Extends & Pumps dynamically while feeding)
      if (anim.proboscisExtend > 0.01) {
        const isFeeding = behavior.current === 'feed';
        const pumpOffset = isFeeding ? Math.sin(now * 0.025) * 2.5 : 0;
        const len = BODY.proboscisLength * anim.proboscisExtend + pumpOffset;
        const headRelBaseY = -5;

        // Proboscis Stem
        ctx.beginPath();
        ctx.moveTo(0, headRelBaseY);
        ctx.lineTo(0, headRelBaseY - len);
        ctx.strokeStyle = COLORS.proboscis;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Labellum (Pumping Tip)
        ctx.beginPath();
        ctx.arc(0, headRelBaseY - len - 1.5, 2.2 + (isFeeding ? Math.sin(now * 0.03) * 0.8 : 0), 0, Math.PI * 2);
        ctx.fillStyle = '#4ade80'; // Emerald feeding suction glow
        ctx.shadowBlur = isFeeding ? 6 : 0;
        ctx.shadowColor = '#22c55e';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const lightStateRef = useRef(lightState);
  const tempStateRef = useRef(tempState);

  useEffect(() => {
    lightStateRef.current = lightState;
    if (BRAIN.stimulate) {
      if (lightState === 'bright') BRAIN.stimulate.lightLevel = 1.0;
      else if (lightState === 'dim') BRAIN.stimulate.lightLevel = 0.5;
      else if (lightState === 'dark') BRAIN.stimulate.lightLevel = 0.0;
    }
  }, [lightState]);

  useEffect(() => {
    tempStateRef.current = tempState;
    if (BRAIN.stimulate) {
      if (tempState === 'warm') BRAIN.stimulate.temperature = 0.75;
      else if (tempState === 'cool') BRAIN.stimulate.temperature = 0.25;
      else BRAIN.stimulate.temperature = 0.5;
    }
  }, [tempState]);

  const handlePointerDown = (clientX, clientY) => {
    const world = screenToWorld(clientX, clientY);
    const sim = simRef.current;
    const { fly } = sim;

    if (activeTool === 'feed') {
      sim.food.push({ x: world.x, y: world.y, eaten: 0 });
      BRAIN.drives.hunger = Math.max(0.5, BRAIN.drives.hunger);
      BRAIN.stimulate.foodNearby = true;
      onLogAction('place_food');
    } else if (activeTool === 'touch') {
      sim.ripples.push({ x: world.x, y: world.y, startTime: Date.now() });
      const distToFly = Math.hypot(world.x - fly.x, world.y - fly.y);

      if (distToFly <= 80) {
        const dx = world.x - fly.x;
        const dy = world.y - fly.y;
        const angle = fly.facingDir - Math.PI / 2;
        const localY = dx * Math.sin(angle) + dy * Math.cos(angle);

        let location = 'thorax';
        if (localY < -17) location = 'head';
        else if (localY > 2) location = 'abdomen';

        BRAIN.stimulate.touch = true;
        BRAIN.stimulate.touchLocation = location;
        sim.touchResetTime = Date.now() + 2000;

        const now = Date.now();
        sim.touchTimestamps.push(now);
        sim.touchTimestamps = sim.touchTimestamps.filter((t) => now - t < 4000);

        BRAIN.drives.fear = 1.0;
        BRAIN.accumStartle = 50;
        onLogAction(sim.touchTimestamps.length >= 3 ? 'scared_fly_pain' : 'touch');
      }
    } else if (activeTool === 'air') {
      sim.isDraggingWind = true;
      sim.dragStart = { x: world.x, y: world.y };
      sim.windArrowEnd = { x: world.x, y: world.y };
      BRAIN.stimulate.wind = true;
      BRAIN.stimulate.windStrength = 0.3;
      BRAIN.stimulate.windDirection = 0;
    }
  };

  const handlePointerMove = (clientX, clientY) => {
    const sim = simRef.current;
    if (!sim.isDraggingWind) return;
    const world = screenToWorld(clientX, clientY);
    sim.windArrowEnd = { x: world.x, y: world.y };

    const dx = world.x - sim.dragStart.x;
    const dy = world.y - sim.dragStart.y;
    const dist = Math.hypot(dx, dy);

    BRAIN.stimulate.windStrength = Math.min(1.0, dist / 150);
    BRAIN.stimulate.windDirection = Math.atan2(dy, dx);
  };

  const handlePointerUp = () => {
    const sim = simRef.current;
    if (sim.isDraggingWind) {
      sim.isDraggingWind = false;
      sim.windResetTime = Date.now() + 2500;
      onLogAction('blow_wind');
    }
  };

  const handleMouseDown = (e) => {
    handlePointerDown(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handlePointerUp();
  };

  const handleTouchStart = (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handlePointerUp();
  };

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
