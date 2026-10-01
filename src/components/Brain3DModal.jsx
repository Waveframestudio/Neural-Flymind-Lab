import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { BRAIN } from '../connectome';

// High-fidelity Drosophila brain anatomical regions
const ANATOMICAL_REGIONS = [
  {
    id: 'optic_l',
    name: 'Lóbulo Óptico Izq.',
    type: 'sensory',
    color: 0x3b82f6,
    neurons: ['VIS_R1R6', 'VIS_R7R8', 'VIS_ME', 'VIS_LO', 'VIS_LC', 'VIS_LPTC'],
    meshes: [
      { type: 'ellipsoid', pos: [-3.4, 0.3, 0], scale: [1.6, 2.2, 1.4], rot: [0, 0, 0.2] }
    ]
  },
  {
    id: 'optic_r',
    name: 'Lóbulo Óptico Der.',
    type: 'sensory',
    color: 0x3b82f6,
    neurons: ['VIS_R1R6', 'VIS_R7R8', 'VIS_ME', 'VIS_LO', 'VIS_LC', 'VIS_LPTC'],
    meshes: [
      { type: 'ellipsoid', pos: [3.4, 0.3, 0], scale: [1.6, 2.2, 1.4], rot: [0, 0, -0.2] }
    ]
  },
  {
    id: 'antennal_lobes',
    name: 'Lóbulos Antenales',
    type: 'sensory',
    color: 0x60a5fa,
    neurons: ['OLF_ORN_FOOD', 'OLF_ORN_DANGER', 'OLF_LN', 'OLF_PN', 'ANTENNAL_MECH'],
    meshes: [
      { type: 'sphere', pos: [-0.85, -1.0, 1.3], scale: [0.8, 0.85, 0.8] },
      { type: 'sphere', pos: [0.85, -1.0, 1.3], scale: [0.8, 0.85, 0.8] }
    ]
  },
  {
    id: 'mushroom_bodies',
    name: 'Cuerpos Pedunculados',
    type: 'central',
    color: 0xa855f7,
    neurons: ['MB_KC', 'MB_APL', 'MB_MBON_APP', 'MB_MBON_AV', 'MB_DAN_REW', 'MB_DAN_PUN'],
    meshes: [
      // Calyxes & Lobe structures (classic mushroom shape)
      { type: 'sphere', pos: [-1.4, 1.5, -0.6], scale: [0.85, 0.85, 0.85] },
      { type: 'sphere', pos: [1.4, 1.5, -0.6], scale: [0.85, 0.85, 0.85] },
      { type: 'cylinder', pos: [-1.1, 0.6, 0.1], scale: [0.35, 1.5, 0.35], rot: [0.3, 0, -0.4] },
      { type: 'cylinder', pos: [1.1, 0.6, 0.1], scale: [0.35, 1.5, 0.35], rot: [0.3, 0, 0.4] }
    ]
  },
  {
    id: 'central_complex',
    name: 'Complejo Central',
    type: 'central',
    color: 0xc084fc,
    neurons: ['CX_EPG', 'CX_PFN', 'CX_FC', 'CX_HDELTA', 'CLOCK_DN'],
    meshes: [
      // Doughnut (Ellipsoid Body) + Fan-Shaped Body
      { type: 'torus', pos: [0, 0.2, 0.7], scale: [1.0, 0.6, 1.0], rot: [0.6, 0, 0] },
      { type: 'box', pos: [0, 0.7, 0.3], scale: [1.4, 0.6, 0.7] }
    ]
  },
  {
    id: 'subesophageal',
    name: 'Zona Subesofágica (SEZ)',
    type: 'motor',
    color: 0xf87171,
    neurons: ['SEZ_FEED', 'SEZ_GROOM', 'SEZ_WATER', 'MN_PROBOSCIS'],
    meshes: [
      { type: 'ellipsoid', pos: [0, -1.9, 0.2], scale: [1.3, 1.0, 1.2] }
    ]
  },
  {
    id: 'drives_center',
    name: 'Núcleos de Impulsos / Emoción',
    type: 'drives',
    color: 0xf59e0b,
    neurons: ['DRIVE_HUNGER', 'DRIVE_FEAR', 'DRIVE_FATIGUE', 'DRIVE_CURIOSITY', 'DRIVE_GROOM'],
    meshes: [
      { type: 'sphere', pos: [-0.9, 0.1, -0.9], scale: [0.65, 0.65, 0.65] },
      { type: 'sphere', pos: [0.9, 0.1, -0.9], scale: [0.65, 0.65, 0.65] }
    ]
  },
  {
    id: 'descending_motor',
    name: 'Vínculo Motor VNC (Patas / Alas)',
    type: 'motor',
    color: 0xef4444,
    neurons: ['DN_WALK', 'DN_FLIGHT', 'DN_TURN', 'DN_STARTLE', 'VNC_CPG', 'MN_LEG_L1', 'MN_LEG_R1'],
    meshes: [
      { type: 'cylinder', pos: [0, -2.8, -0.4], scale: [0.7, 1.6, 0.7], rot: [0.2, 0, 0] }
    ]
  }
];

export default function Brain3DModal({ isOpen, onClose }) {
  const containerRef = useRef(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'sensory', 'central', 'drives', 'motor'
  const [telemetry, setTelemetry] = useState({ totalActive: 0, firingRate: 0, topRegion: 'Normal' });

  useEffect(() => {
    if (!isOpen) return;

    let animId;
    let cleanup = null;

    // Small frame delay to guarantee containerRef is attached to DOM
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913); // Deep space bio-lab dark
    scene.fog = new THREE.FogExp2(0x060913, 0.03);

    // --- Camera & Renderer ---
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 11);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    containerRef.current.appendChild(renderer.domElement);

    // Attach pointer move listener for 3D raycasting inspection
    renderer.domElement.addEventListener('mousemove', handlePointerMove);

    // --- Orbit Controls ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 25;
    controls.minDistance = 3;

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    mainLight.position.set(6, 12, 8);
    scene.add(mainLight);

    const backLight = new THREE.DirectionalLight(0xa855f7, 1.8);
    backLight.position.set(-6, -6, -8);
    scene.add(backLight);

    const centerGlowLight = new THREE.PointLight(0x38bdf8, 2.0, 10);
    centerGlowLight.position.set(0, 0, 0);
    scene.add(centerGlowLight);

    // --- Outer Brain Contour Shell (Transparent Hologram Mesh) ---
    const shellGeo = new THREE.SphereGeometry(4.6, 32, 32);
    shellGeo.scale(1.15, 0.85, 0.95);
    const shellMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.12,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 1.2,
      wireframe: true,
      emissive: 0x1e3a8a,
      emissiveIntensity: 0.15,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    scene.add(shellMesh);

    // --- Build Region 3D Meshes ---
    const regionObjects = [];

    ANATOMICAL_REGIONS.forEach((reg) => {
      const regGroup = new THREE.Group();
      regGroup.userData = { region: reg };

      const mat = new THREE.MeshPhysicalMaterial({
        color: reg.color,
        emissive: reg.color,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.65,
        roughness: 0.2,
        metalness: 0.1,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      });

      const wireMat = new THREE.MeshBasicMaterial({
        color: reg.color,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });

      reg.meshes.forEach((mDef) => {
        let geo;
        if (mDef.type === 'sphere') geo = new THREE.SphereGeometry(1, 24, 24);
        else if (mDef.type === 'ellipsoid') geo = new THREE.SphereGeometry(1, 24, 24);
        else if (mDef.type === 'cylinder') geo = new THREE.CylinderGeometry(1, 1, 1, 20);
        else if (mDef.type === 'torus') geo = new THREE.TorusGeometry(1, 0.35, 16, 32);
        else geo = new THREE.BoxGeometry(1, 1, 1);

        const mesh = new THREE.Mesh(geo, mat);
        const wire = new THREE.Mesh(geo, wireMat);

        mesh.position.set(...mDef.pos);
        mesh.scale.set(...mDef.scale);
        wire.position.set(...mDef.pos);
        wire.scale.set(...mDef.scale);

        if (mDef.rot) {
          mesh.rotation.set(...mDef.rot);
          wire.rotation.set(...mDef.rot);
        }

        regGroup.add(mesh);
        regGroup.add(wire);
      });

      scene.add(regGroup);
      regionObjects.push({ regGroup, reg, mat });
    });

    // --- High-Density Neural Particle Cloud (Representing 139K Neurons) ---
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Distribute particles randomly inside brain volume
      const r = Math.pow(Math.random(), 0.5) * 4.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const px = r * Math.sin(phi) * Math.cos(theta) * 1.1;
      const py = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      const pz = r * Math.cos(phi) * 0.95;

      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;

      // Color coding (cyan/purple/gold mix)
      const cType = Math.random();
      if (cType < 0.4) {
        particleColors[i * 3] = 0.22; particleColors[i * 3 + 1] = 0.74; particleColors[i * 3 + 2] = 0.97;
      } else if (cType < 0.7) {
        particleColors[i * 3] = 0.66; particleColors[i * 3 + 1] = 0.33; particleColors[i * 3 + 2] = 0.97;
      } else {
        particleColors[i * 3] = 0.96; particleColors[i * 3 + 1] = 0.62; particleColors[i * 3 + 2] = 0.04;
      }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // --- Dynamic Axon Synapse Connections (Interactive Neural Network Lines) ---
    const axonCount = 140;
    const axonGeo = new THREE.BufferGeometry();
    const axonPositions = new Float32Array(axonCount * 6); // 2 points per line segment

    for (let i = 0; i < axonCount; i++) {
      const idx1 = Math.floor(Math.random() * particleCount);
      const idx2 = Math.floor(Math.random() * particleCount);

      axonPositions[i * 6] = particlePositions[idx1 * 3];
      axonPositions[i * 6 + 1] = particlePositions[idx1 * 3 + 1];
      axonPositions[i * 6 + 2] = particlePositions[idx1 * 3 + 2];

      axonPositions[i * 6 + 3] = particlePositions[idx2 * 3];
      axonPositions[i * 6 + 4] = particlePositions[idx2 * 3 + 1];
      axonPositions[i * 6 + 5] = particlePositions[idx2 * 3 + 2];
    }

    axonGeo.setAttribute('position', new THREE.BufferAttribute(axonPositions, 3));
    const axonMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const axonLines = new THREE.LineSegments(axonGeo, axonMat);
    scene.add(axonLines);

    // --- Raycaster for Hover & Selection ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const allMeshes = [];
      regionObjects.forEach((ro) => ro.regGroup.traverse((child) => { if (child.isMesh) allMeshes.push(child); }));

      const intersects = raycaster.intersectObjects(allMeshes);
      if (intersects.length > 0) {
        let parent = intersects[0].object.parent;
        while (parent && !parent.userData.region) parent = parent.parent;
        if (parent && parent.userData.region) {
          setSelectedRegion(parent.userData.region);
        }
      }
    };

    let animId;
    let startTime = performance.now();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) / 1000;

      controls.update();

      // Gentle auto rotation when idle
      shellMesh.rotation.y = elapsedTime * 0.05;
      particleSystem.rotation.y = elapsedTime * 0.04;
      axonLines.rotation.y = elapsedTime * 0.04;

      let totalFiring = 0;
      let maxActivity = 0;
      let topRegName = 'Reposo';

      // Update region glows based on real-time neural firing from connectome
      regionObjects.forEach(({ regGroup, reg, mat }) => {
        let sum = 0;
        reg.neurons.forEach((n) => {
          if (BRAIN.postSynaptic && BRAIN.postSynaptic[n]) {
            sum += BRAIN.postSynaptic[n][BRAIN.nextState] || 0;
          }
        });
        const avg = reg.neurons.length ? sum / reg.neurons.length : 0;
        totalFiring += sum;

        if (avg > maxActivity) {
          maxActivity = avg;
          topRegName = reg.name;
        }

        const intensity = Math.min(2.0, avg / 20);

        // Pulse effect
        const pulse = Math.sin(elapsedTime * 4 + reg.name.length) * 0.1;
        mat.emissiveIntensity = 0.25 + intensity + pulse;
        mat.opacity = 0.5 + Math.min(0.4, intensity * 0.4);

        // Filter visibility
        if (activeFilter !== 'all' && reg.type !== activeFilter) {
          regGroup.visible = false;
        } else {
          regGroup.visible = true;
        }
      });

      setTelemetry({
        totalActive: Math.round(totalFiring),
        firingRate: Math.round(maxActivity * 4.2),
        topRegion: topRegName,
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

      cleanup = () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('resize', handleResize);
        if (renderer.domElement) {
          renderer.domElement.removeEventListener('mousemove', handlePointerMove);
        }
        controls.dispose();
        renderer.dispose();
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    }, 0);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, [isOpen, activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="b3d-modal-backdrop" onClick={onClose}>
      <div className="b3d-modal-window" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="b3d-header">
          <div className="b3d-title-group">
            <span className="b3d-title">Conectoma Cerebral 3D — Drosophila melanogaster</span>
            <span className="b3d-subtitle">FlyWire FAFB v783 • 139,255 neuronas / 2.69M sinapsis</span>
          </div>
          <button className="b3d-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Modal Body & Controls */}
        <div className="b3d-body">
          {/* 3D Canvas */}
          <div ref={containerRef} className="b3d-viewport" />

          {/* Interactive Filter HUD Panel */}
          <div className="b3d-hud-panel">
            <div className="b3d-hud-title">Filtros de Capa Neuronal</div>
            <div className="b3d-filter-buttons">
              {[
                { id: 'all', label: 'Todas las capas' },
                { id: 'sensory', label: 'Sensorial (Azul)' },
                { id: 'central', label: 'Central / Memoria (Púrpura)' },
                { id: 'drives', label: 'Impulsos (Dorado)' },
                { id: 'motor', label: 'Motor (Rojo)' },
              ].map((f) => (
                <button
                  key={f.id}
                  className={`b3d-filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Live Telemetry Panel */}
            <div className="b3d-telemetry-box">
              <div className="telemetry-item">
                <span className="telemetry-label">Actividad Total:</span>
                <span className="telemetry-val">{telemetry.totalActive} Hz</span>
              </div>
              <div className="telemetry-item">
                <span className="telemetry-label">Región Dominante:</span>
                <span className="telemetry-val highlight">{telemetry.topRegion}</span>
              </div>
            </div>

            {/* Selected Region Information */}
            {selectedRegion ? (
              <div className="b3d-region-card">
                <div className="card-name">{selectedRegion.name}</div>
                <div className="card-type">Tipo: {selectedRegion.type.toUpperCase()}</div>
                <div className="card-neurons">
                  Neuronas activas en tiempo real:
                  <div className="neuron-list">
                    {selectedRegion.neurons.map((n) => (
                      <span key={n} className="neuron-chip">{n}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="b3d-region-card placeholder">
                Pasa el cursor sobre una estructura cerebral 3D para inspeccionar sus neuronas y actividad.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
