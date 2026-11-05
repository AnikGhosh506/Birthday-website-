import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles } from 'lucide-react';

interface BirthdayBurstOverlayProps {
  sisterName: string;
  triggerKey?: number;
}

interface HeartBody {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  swayPhase: number;
  swaySpeed: number;
  swayAmp: number;
  initialScale: number;
}

interface GlitterBody {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotSpeed: THREE.Vector3;
  twinklePhase: number;
  twinkleSpeed: number;
  baseScale: number;
}

function createExtrudedHeartGeometry(): THREE.ExtrudeGeometry {
  const x = 0;
  const y = 0;
  const heartShape = new THREE.Shape();
  heartShape.moveTo(x, y + 0.25);
  heartShape.bezierCurveTo(x, y + 0.25, x - 0.2, y + 0.65, x - 0.55, y + 0.65);
  heartShape.bezierCurveTo(x - 1.05, y + 0.65, x - 1.05, y + 0.05, x - 1.05, y + 0.05);
  heartShape.bezierCurveTo(x - 1.05, y - 0.35, x - 0.65, y - 0.77, x, y - 1.15);
  heartShape.bezierCurveTo(x + 0.65, y - 0.77, x + 1.05, y - 0.35, x + 1.05, y + 0.05);
  heartShape.bezierCurveTo(x + 1.05, y + 0.05, x + 1.05, y + 0.65, x + 0.55, y + 0.65);
  heartShape.bezierCurveTo(x + 0.2, y + 0.65, x, y + 0.25, x, y + 0.25);

  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 0.28,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.12,
  };

  const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
  geometry.center();
  return geometry;
}

export const BirthdayBurstOverlay: React.FC<BirthdayBurstOverlayProps> = ({
  sisterName,
  triggerKey = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    setIsFadingOut(false);

    const container = mountRef.current;
    if (!container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio & warm celebration lights so 3D hearts & metallic glitter catch specular highlights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d2, 2.6);
    keyLight.position.set(8, 14, 12);
    scene.add(keyLight);

    const roseRimLight = new THREE.PointLight(0xff4d79, 3.2, 35);
    roseRimLight.position.set(-9, 6, 10);
    scene.add(roseRimLight);

    const goldSparkLight = new THREE.PointLight(0xfbbf24, 2.8, 35);
    goldSparkLight.position.set(9, -5, 11);
    scene.add(goldSparkLight);

    // 1. Create 3D Extruded Volumetric Hearts
    const heartGeometry = createExtrudedHeartGeometry();
    const heartPalette = [
      { color: 0xe11d48, emissive: 0x4c0519, metalness: 0.25, roughness: 0.22 }, // Ruby Rose
      { color: 0xf43f5e, emissive: 0x881337, metalness: 0.2, roughness: 0.25 },  // Coral Rose
      { color: 0xfb7185, emissive: 0x881337, metalness: 0.18, roughness: 0.28 }, // Blush Pink
      { color: 0xf59e0b, emissive: 0x78350f, metalness: 0.65, roughness: 0.18 }, // Metallic Sunrise Gold
      { color: 0xfbbf24, emissive: 0x78350f, metalness: 0.72, roughness: 0.15 }, // Champagne Gold
      { color: 0xfda4af, emissive: 0x9f1239, metalness: 0.3, roughness: 0.2 },   // Pearl Rose
    ];

    const heartMaterials = heartPalette.map(
      (p) =>
        new THREE.MeshStandardMaterial({
          color: p.color,
          emissive: p.emissive,
          emissiveIntensity: 0.25,
          metalness: p.metalness,
          roughness: p.roughness,
        })
    );

    const hearts: HeartBody[] = [];
    const HEART_COUNT = 38;

    for (let i = 0; i < HEART_COUNT; i++) {
      const mat = heartMaterials[i % heartMaterials.length];
      const mesh = new THREE.Mesh(heartGeometry, mat);

      // Erupt in a joyful 3D fountain + radial burst across the screen
      const angle = (i / HEART_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const radialSpeed = 1.6 + Math.random() * 5.2;
      const startSpread = Math.random() * 1.8;

      mesh.position.set(
        Math.cos(angle) * startSpread,
        -2.2 + Math.sin(angle) * startSpread * 0.6,
        (Math.random() - 0.5) * 5
      );

      mesh.rotation.set(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * Math.PI,
        (Math.random() - 0.5) * 0.6
      );

      const scale = 0.28 + Math.random() * 0.36;
      mesh.scale.setScalar(0.01);

      scene.add(mesh);

      hearts.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.cos(angle) * radialSpeed * 0.85,
          2.6 + Math.random() * 4.4 + Math.max(0, Math.sin(angle)) * 2.2,
          (Math.random() - 0.5) * 2.4
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          (Math.random() - 0.5) * 3.4,
          (Math.random() - 0.5) * 1.8
        ),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 1.8 + Math.random() * 2.2,
        swayAmp: 0.5 + Math.random() * 0.9,
        initialScale: scale,
      });
    }

    // 2. Create 3D Faceted Diamond Glitter Crystals
    const glitterGeometry = new THREE.OctahedronGeometry(0.14, 0);
    const glitterColors = [0xffd700, 0xfef08a, 0xfda4af, 0xffffff, 0xf43f5e, 0xfbbf24];
    const glitterMaterials = glitterColors.map(
      (col) =>
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.65,
          metalness: 0.85,
          roughness: 0.08,
        })
    );

    const glitters: GlitterBody[] = [];
    const GLITTER_COUNT = 135;

    for (let i = 0; i < GLITTER_COUNT; i++) {
      const mat = glitterMaterials[i % glitterMaterials.length];
      const mesh = new THREE.Mesh(glitterGeometry, mat);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const burstSpeed = 2.5 + Math.random() * 8.5;

      mesh.position.set(
        (Math.random() - 0.5) * 2.5,
        -1.0 + (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 4.0
      );

      const baseScale = 0.5 + Math.random() * 1.35;
      mesh.scale.set(baseScale * 0.75, baseScale * 1.45, baseScale * 0.75);
      scene.add(mesh);

      glitters.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * burstSpeed,
          Math.abs(Math.cos(phi)) * burstSpeed * 0.95 + 1.8,
          Math.sin(phi) * Math.sin(theta) * burstSpeed * 0.6
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 7,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 7
        ),
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 6 + Math.random() * 8,
        baseScale,
      });
    }

    // 3. Fine Shimmering Stardust Cloud (Points)
    const dustCount = 260;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustVelocities: THREE.Vector3[] = [];
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 6;
      dustPositions[i * 3 + 1] = -1.5 + (Math.random() - 0.5) * 3;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 7.5;
      dustVelocities.push(
        new THREE.Vector3(
          Math.cos(angle) * speed,
          1.2 + Math.random() * 5.8,
          (Math.random() - 0.5) * 3.5
        )
      );
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xfff3c4,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dustPoints);

    const clock = new THREE.Clock();
    let rafId: number | null = null;

    const animate = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      // Animate 3D Hearts: initial pop-in scale, upward buoyancy + gentle sway
      for (const h of hearts) {
        const popProgress = Math.min(1, elapsed / 0.42);
        const easeOutBack =
          1 + 1.7 * Math.pow(popProgress - 1, 3) + 0.7 * Math.pow(popProgress - 1, 2);
        const currentScale = h.initialScale * Math.max(0.05, easeOutBack);
        h.mesh.scale.setScalar(currentScale);

        // Air drag on X/Z and gentle upward float with slight gravity transition
        h.velocity.x *= 0.988;
        h.velocity.z *= 0.988;
        h.velocity.y -= 0.42 * dt; // very gentle deceleration so hearts float across the screen

        h.mesh.position.x +=
          h.velocity.x * dt +
          Math.sin(elapsed * h.swaySpeed + h.swayPhase) * h.swayAmp * dt;
        h.mesh.position.y += h.velocity.y * dt;
        h.mesh.position.z += h.velocity.z * dt;

        h.mesh.rotation.x += h.rotSpeed.x * dt;
        h.mesh.rotation.y += h.rotSpeed.y * dt;
        h.mesh.rotation.z +=
          Math.cos(elapsed * h.swaySpeed + h.swayPhase) * 0.35 * dt;
      }

      // Animate 3D Faceted Glitter Crystals: burst outward, shimmer & slowly flutter down
      for (const g of glitters) {
        g.velocity.x *= 0.982;
        g.velocity.z *= 0.982;
        g.velocity.y -= 1.55 * dt; // flutter downward like golden glitter

        g.mesh.position.x +=
          g.velocity.x * dt + Math.cos(elapsed * 3 + g.twinklePhase) * 0.35 * dt;
        g.mesh.position.y += g.velocity.y * dt;
        g.mesh.position.z += g.velocity.z * dt;

        g.mesh.rotation.x += g.rotSpeed.x * dt;
        g.mesh.rotation.y += g.rotSpeed.y * dt;
        g.mesh.rotation.z += g.rotSpeed.z * dt;

        const twinkle =
          0.45 + 0.75 * Math.abs(Math.sin(elapsed * g.twinkleSpeed + g.twinklePhase));
        g.mesh.scale.set(
          g.baseScale * 0.7 * twinkle,
          g.baseScale * 1.4 * twinkle,
          g.baseScale * 0.7 * twinkle
        );
      }

      // Animate fine glitter dust points
      const posAttr = dustGeometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        const v = dustVelocities[i];
        v.x *= 0.985;
        v.y -= 1.15 * dt;
        posAttr.setXYZ(
          i,
          posAttr.getX(i) + v.x * dt,
          posAttr.getY(i) + v.y * dt,
          posAttr.getZ(i) + v.z * dt
        );
      }
      posAttr.needsUpdate = true;
      dustMaterial.opacity = Math.max(0, 0.95 - elapsed * 0.16);

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, 4300);

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, 5500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      heartGeometry.dispose();
      heartMaterials.forEach((m) => m.dispose());
      glitterGeometry.dispose();
      glitterMaterials.forEach((m) => m.dispose());
      dustGeometry.dispose();
      dustMaterial.dispose();
      renderer.dispose();
    };
  }, [triggerKey]);

  if (!isVisible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-50 pointer-events-none transition-opacity duration-1000 ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* 3D WebGL Floating Hearts & Glitter Canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Celebratory Entrance Banner */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/90 backdrop-blur-md border border-amber-300/80 shadow-xl text-stone-900">
        <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
        <span className="text-xs sm:text-sm font-serif font-bold tracking-wide">
          Happy Birthday, {sisterName || 'Atrayee'}! ✨
        </span>
      </div>
    </div>
  );
};
