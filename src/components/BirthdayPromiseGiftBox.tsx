import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Gift,
  Sparkles,
  Heart,
  RotateCcw,
  Check,
  PenTool,
  Award,
  ChevronRight,
  Volume2,
  Smartphone,
} from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';
import { triggerConfettiExplosion } from '../utils/confettiExplosion';

interface BirthdayPromiseGiftBoxProps {
  girlfriendName: string;
  boyfriendName: string;
}

interface SiblingPromisePreset {
  id: string;
  badge: string;
  title: string;
  salutation: string;
  body: string;
  pledgeItems: string[];
  signOff: string;
}

const SIBLING_PROMISE_PRESETS: SiblingPromisePreset[] = [
  {
    id: 'forever-corner',
    badge: 'Promise #01 · Lifelong Sibling Vow',
    title: 'My Forever Little Brother Promise to You',
    salutation: 'Dearest Atrayee Didi,',
    body: `On your birthday and every single day after, I promise that no matter how busy life gets between Bangalore, NIT, or home, you will always have your little brother cheering the loudest in your corner.\n\nWhenever a day feels heavy, I promise to bring you your favorite Magnum ice cream, listen to every word without judgment, and remind you how deeply proud I am to call you my sister.`,
    pledgeItems: [
      'Unlimited 3:30 AM cinema talks & Magnum ice cream treats on my tab',
      'Always answering your call — whether for a big life update or a random rant',
      'Protecting your peace and celebrating every single win of yours like a festival',
    ],
    signOff: 'Forever your proudest little brother,\nAnik ♥',
  },
  {
    id: 'kali-pujo-reunion',
    badge: 'Promise #02 · Hometown & Festival Vow',
    title: 'The Kali Pujo & Hometown Reunion Promise',
    salutation: 'My Favorite Didi,',
    body: `I promise that every time we are back home together — especially during Kali Pujo and family celebrations — we will pause the rush of adulthood and relive our favorite childhood memories.\n\nFrom hopping across pandals and eating phuchka until we cannot walk, to taking a hundred photos where I pretend to be annoyed but secretly treasure every frame, those days belong to us.`,
    pledgeItems: [
      'A dedicated sibling food-walk & dessert outing every time we reunite home',
      'Being your personal photographer for every saree & festive look without complaining',
      'Keeping our inside jokes and childhood traditions alive for decades to come',
    ],
    signOff: 'With all my love and a lifetime of treats,\nAnik ♥',
  },
  {
    id: 'dream-cheerleader',
    badge: 'Promise #03 · Dreams & Milestones Vow',
    title: 'Your Lifelong Cheerleader Promise',
    salutation: 'To the Strongest Didi I Know,',
    body: `You have guided me, inspired me, and shown me what grace and resilience look like. Today, I promise to always stand behind your biggest dreams just the way you have always stood behind mine.\n\nMay this new year of your life bring you radiant health, boundless joy, and every success your heart has ever wished for.`,
    pledgeItems: [
      'Reminding you of your magic whenever you doubt yourself even for a second',
      'Bringing laughter and warmth to every birthday, milestone, and ordinary Sunday',
      'Being your safe harbor and loudest supporter, today and always',
    ],
    signOff: 'Happy Birthday, Didi — always in your corner,\nAnik ♥',
  },
];

type UnwrapStage = 'wrapped' | 'ribbon-untied' | 'unwrapped';

const CUSTOM_PROMISE_STORAGE_KEY = 'atrayee_birthday_promise_custom_v1';

export const BirthdayPromiseGiftBox: React.FC<BirthdayPromiseGiftBoxProps> = ({
  girlfriendName,
  boyfriendName,
}) => {
  const [unwrapStage, setUnwrapStage] = useState<UnwrapStage>('wrapped');
  const [activePresetIndex, setActivePresetIndex] = useState<number>(0);
  const [isPromiseSealed, setIsPromiseSealed] = useState<boolean>(false);
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);
  const [hapticPulseActive, setHapticPulseActive] = useState<boolean>(false);
  const [sensoryCueText, setSensoryCueText] = useState<string | null>(null);
  const [customPromiseText, setCustomPromiseText] = useState<string>(() => {
    try {
      return localStorage.getItem(CUSTOM_PROMISE_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const unwrapStageRef = useRef<UnwrapStage>('wrapped');
  const boxVelocityRef = useRef<number>(0);
  const sensoryTimeoutRef = useRef<number | null>(null);
  const pointerDownRef = useRef<{ isDown: boolean; startX: number; moved: boolean }>({
    isDown: false,
    startX: 0,
    moved: false,
  });

  const supportsHaptics =
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

  useEffect(() => {
    unwrapStageRef.current = unwrapStage;
  }, [unwrapStage]);

  useEffect(() => {
    return () => {
      if (sensoryTimeoutRef.current) {
        window.clearTimeout(sensoryTimeoutRef.current);
      }
    };
  }, []);

  // Trigger browser haptic vibration (if supported) + visual tactile pulse feedback
  const triggerUnboxingHaptics = (pattern: number | number[], cueLabel: string) => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore environments that block navigator.vibrate
    }

    setHapticPulseActive(true);
    setSensoryCueText(cueLabel);

    if (sensoryTimeoutRef.current) {
      window.clearTimeout(sensoryTimeoutRef.current);
    }
    sensoryTimeoutRef.current = window.setTimeout(() => {
      setHapticPulseActive(false);
    }, 650);
  };

  // Save custom promise text
  const handleSaveCustomPromise = (value: string) => {
    setCustomPromiseText(value);
    try {
      localStorage.setItem(CUSTOM_PROMISE_STORAGE_KEY, value);
    } catch {
      // ignore storage errors
    }
  };

  // Advance unwrap state when user clicks/touches the 3D Gift Box
  const handleInteractWithGiftBox = () => {
    if (unwrapStage === 'wrapped') {
      romanticAudio.playRibbonUntie();
      triggerUnboxingHaptics(
        [25, 40, 55],
        'Satin Ribbon Untied · Swish SFX & Haptic Tap'
      );
      boxVelocityRef.current += 0.24;
      setUnwrapStage('ribbon-untied');
    } else if (unwrapStage === 'ribbon-untied') {
      romanticAudio.playGiftUnboxing();
      triggerUnboxingHaptics(
        [45, 50, 85, 40, 120],
        'Virtual Gift Unboxed · Velvet Lid Pop, Harp Arpeggio & Haptics'
      );
      boxVelocityRef.current += 0.32;
      triggerConfettiExplosion();
      setUnwrapStage('unwrapped');
    } else {
      // When already unwrapped, clicking the 3D gift box replays the magical unboxing SFX + haptic pulse
      romanticAudio.playGiftUnboxing();
      triggerUnboxingHaptics(
        [35, 45, 90],
        'Replaying Virtual Gift Unboxing Sound & Haptic Pulse'
      );
      boxVelocityRef.current += 0.2;
    }
  };

  const handleInstantUnwrap = () => {
    romanticAudio.playGiftUnboxing();
    triggerUnboxingHaptics(
      [45, 50, 85, 40, 120],
      'Virtual Gift Unboxed · Velvet Lid Pop, Harp Arpeggio & Haptics'
    );
    boxVelocityRef.current += 0.32;
    triggerConfettiExplosion();
    setUnwrapStage('unwrapped');
  };

  const handleRewrapGift = () => {
    romanticAudio.playRibbonUntie();
    triggerUnboxingHaptics([20, 30, 25], 'Gift Box Rewrapped · Ready to Unbox Again');
    setIsPromiseSealed(false);
    setUnwrapStage('wrapped');
  };

  const handleSealPromise = () => {
    romanticAudio.playCelebrationChime();
    triggerUnboxingHaptics([35, 40, 75], 'Birthday Promise Sealed with Wax Stamp ♥');
    triggerConfettiExplosion();
    setIsPromiseSealed(true);
  };

  // Initialize Three.js 3D Unwrappable Gift Box Scene
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 2.5, 6.2);
    camera.lookAt(0, 0.25, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff5f5, 1.35);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(4, 7, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfda4af, 1.4);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const innerGlowLight = new THREE.PointLight(0xfbbf24, 0, 5);
    innerGlowLight.position.set(0, 0.4, 0);
    scene.add(innerGlowLight);

    // Root gift group
    const giftGroup = new THREE.Group();
    giftGroup.position.y = -0.35;
    scene.add(giftGroup);

    // Materials
    const boxCrimsonMat = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      roughness: 0.35,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });
    const boxInteriorGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      roughness: 0.4,
      metalness: 0.2,
    });
    const ribbonGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.72,
    });
    const cardParchmentMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      roughness: 0.3,
      metalness: 0.08,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.15,
    });

    const boxSize = 1.9;
    const wallThickness = 0.08;

    // Base floor of the box
    const baseGeo = new THREE.BoxGeometry(boxSize, wallThickness, boxSize);
    const baseMesh = new THREE.Mesh(baseGeo, boxInteriorGoldMat);
    baseMesh.position.y = -boxSize / 2;
    giftGroup.add(baseMesh);

    // 4 Hinged Side Walls so the box unfolds when unwrapped
    const sideWalls: {
      pivot: THREE.Group;
      targetAngle: number;
      axis: 'x' | 'z';
      dir: 1 | -1;
    }[] = [];

    const wallConfigs: {
      pos: [number, number, number];
      rotAxis: 'x' | 'z';
      dir: 1 | -1;
      isZWall: boolean;
    }[] = [
      { pos: [0, -boxSize / 2, boxSize / 2], rotAxis: 'x', dir: 1, isZWall: true },
      { pos: [0, -boxSize / 2, -boxSize / 2], rotAxis: 'x', dir: -1, isZWall: true },
      { pos: [boxSize / 2, -boxSize / 2, 0], rotAxis: 'z', dir: -1, isZWall: false },
      { pos: [-boxSize / 2, -boxSize / 2, 0], rotAxis: 'z', dir: 1, isZWall: false },
    ];

    const sideRibbons: THREE.Mesh[] = [];

    wallConfigs.forEach((cfg) => {
      const pivot = new THREE.Group();
      pivot.position.set(...cfg.pos);

      const wGeo = cfg.isZWall
        ? new THREE.BoxGeometry(boxSize, boxSize, wallThickness)
        : new THREE.BoxGeometry(wallThickness, boxSize, boxSize);
      const wallMesh = new THREE.Mesh(wGeo, boxCrimsonMat);
      wallMesh.position.y = boxSize / 2;
      pivot.add(wallMesh);

      // Vertical gold ribbon strip on each wall
      const rGeo = cfg.isZWall
        ? new THREE.BoxGeometry(0.28, boxSize + 0.02, wallThickness + 0.03)
        : new THREE.BoxGeometry(wallThickness + 0.03, boxSize + 0.02, 0.28);
      const rMesh = new THREE.Mesh(rGeo, ribbonGoldMat);
      rMesh.position.y = boxSize / 2;
      pivot.add(rMesh);
      sideRibbons.push(rMesh);

      giftGroup.add(pivot);
      sideWalls.push({
        pivot,
        targetAngle: 0,
        axis: cfg.rotAxis,
        dir: cfg.dir,
      });
    });

    // Gift Lid Group
    const lidGroup = new THREE.Group();
    lidGroup.position.y = boxSize / 2 + 0.04;
    giftGroup.add(lidGroup);

    const lidWidth = boxSize + 0.16;
    const lidHeight = 0.34;
    const lidGeo = new THREE.BoxGeometry(lidWidth, lidHeight, lidWidth);
    const lidMesh = new THREE.Mesh(lidGeo, boxCrimsonMat);
    lidGroup.add(lidMesh);

    // Cross ribbons on lid
    const lidRibbon1 = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, lidHeight + 0.03, lidWidth + 0.03),
      ribbonGoldMat
    );
    const lidRibbon2 = new THREE.Mesh(
      new THREE.BoxGeometry(lidWidth + 0.03, lidHeight + 0.03, 0.3),
      ribbonGoldMat
    );
    lidGroup.add(lidRibbon1, lidRibbon2);

    // 3D Sculpted Satin Bow Group on top of lid
    const bowGroup = new THREE.Group();
    bowGroup.position.y = lidHeight / 2 + 0.16;
    lidGroup.add(bowGroup);

    const torusGeo = new THREE.TorusGeometry(0.28, 0.085, 16, 36);
    for (let i = 0; i < 4; i++) {
      const loop = new THREE.Mesh(torusGeo, ribbonGoldMat);
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      loop.position.set(Math.cos(angle) * 0.2, 0.05, Math.sin(angle) * 0.2);
      loop.rotation.y = -angle;
      loop.rotation.x = 0.45;
      bowGroup.add(loop);
    }

    const knotMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 16),
      ribbonGoldMat
    );
    knotMesh.position.y = 0.04;
    bowGroup.add(knotMesh);

    // Rising 3D Golden Promise Card inside the box
    const innerCardGroup = new THREE.Group();
    innerCardGroup.position.y = -0.25;
    innerCardGroup.scale.set(0.6, 0.6, 0.6);
    giftGroup.add(innerCardGroup);

    const cardMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.35, 0.95, 0.05),
      cardParchmentMat
    );
    innerCardGroup.add(cardMesh);

    const cardBorderMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.42, 1.02, 0.03),
      ribbonGoldMat
    );
    cardBorderMesh.position.z = -0.015;
    innerCardGroup.add(cardBorderMesh);

    // Wax heart seal on the 3D inner card
    const sealMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.06, 24),
      boxCrimsonMat
    );
    sealMesh.rotation.x = Math.PI / 2;
    sealMesh.position.set(0, 0, 0.035);
    innerCardGroup.add(sealMesh);

    // Floating sparkle spheres around the gift box
    const sparklesGroup = new THREE.Group();
    scene.add(sparklesGroup);
    const sparkleGeo = new THREE.OctahedronGeometry(0.06, 0);
    const sparkleMeshes: { mesh: THREE.Mesh; speed: number; offset: number; radius: number }[] = [];

    for (let i = 0; i < 18; i++) {
      const sMesh = new THREE.Mesh(sparkleGeo, ribbonGoldMat);
      const angle = (i / 18) * Math.PI * 2;
      const radius = 1.6 + (i % 3) * 0.45;
      sMesh.position.set(
        Math.cos(angle) * radius,
        (Math.random() - 0.3) * 2.2,
        Math.sin(angle) * radius
      );
      sparklesGroup.add(sMesh);
      sparkleMeshes.push({
        mesh: sMesh,
        speed: 0.8 + Math.random() * 1.2,
        offset: i * 0.7,
        radius,
      });
    }

    // Animation loop
    let animFrameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const stage = unwrapStageRef.current;

      // Gentle rotation + user spin velocity
      if (!pointerDownRef.current.isDown) {
        giftGroup.rotation.y += 0.007 + boxVelocityRef.current;
        boxVelocityRef.current *= 0.92;
      }

      // Bobbing motion when wrapped
      if (stage === 'wrapped') {
        giftGroup.position.y = -0.35 + Math.sin(elapsed * 2.2) * 0.07;
      } else if (stage === 'ribbon-untied') {
        giftGroup.position.y =
          -0.35 + Math.sin(elapsed * 5.5) * 0.05;
      } else {
        giftGroup.position.y += (-0.55 - giftGroup.position.y) * 0.08;
      }

      // Bow & Ribbon transitions
      const targetBowScale = stage === 'wrapped' ? 1 : 0.01;
      bowGroup.scale.lerp(
        new THREE.Vector3(targetBowScale, targetBowScale, targetBowScale),
        0.1
      );
      bowGroup.position.y +=
        ((stage === 'wrapped' ? lidHeight / 2 + 0.16 : 1.4) -
          bowGroup.position.y) *
        0.08;

      // Lid lift & tilt transition
      const targetLidY =
        stage === 'wrapped'
          ? boxSize / 2 + 0.04
          : stage === 'ribbon-untied'
            ? boxSize / 2 + 0.26 + Math.sin(elapsed * 6) * 0.04
            : 3.6;
      const targetLidRotZ = stage === 'unwrapped' ? 0.65 : 0;
      const targetLidScale = stage === 'unwrapped' ? 0.01 : 1;

      lidGroup.position.y += (targetLidY - lidGroup.position.y) * 0.09;
      lidGroup.rotation.z += (targetLidRotZ - lidGroup.rotation.z) * 0.08;
      lidGroup.scale.lerp(
        new THREE.Vector3(targetLidScale, targetLidScale, targetLidScale),
        0.08
      );

      // Unfold the 4 walls flat like a blooming gift box when unwrapped
      sideWalls.forEach((wall) => {
        const targetAngle =
          stage === 'unwrapped'
            ? wall.dir * (Math.PI * 0.46)
            : stage === 'ribbon-untied'
              ? wall.dir * 0.06
              : 0;
        if (wall.axis === 'x') {
          wall.pivot.rotation.x +=
            (targetAngle - wall.pivot.rotation.x) * 0.09;
        } else {
          wall.pivot.rotation.z +=
            (targetAngle - wall.pivot.rotation.z) * 0.09;
        }
      });

      // Elevate the glowing 3D Promise Card from inside the box
      const targetCardY = stage === 'unwrapped' ? 1.15 + Math.sin(elapsed * 2.5) * 0.08 : -0.25;
      const targetCardScale = stage === 'unwrapped' ? 1.12 : 0.55;
      innerCardGroup.position.y +=
        (targetCardY - innerCardGroup.position.y) * 0.08;
      innerCardGroup.scale.lerp(
        new THREE.Vector3(targetCardScale, targetCardScale, targetCardScale),
        0.08
      );

      // Inner golden light intensity
      const targetLightIntensity =
        stage === 'unwrapped' ? 3.5 : stage === 'ribbon-untied' ? 1.5 : 0.2;
      innerGlowLight.intensity +=
        (targetLightIntensity - innerGlowLight.intensity) * 0.08;

      // Orbiting sparkles
      sparkleMeshes.forEach((sp) => {
        sp.mesh.rotation.x += 0.02 * sp.speed;
        sp.mesh.rotation.y += 0.03 * sp.speed;
        const currentRadius =
          stage === 'unwrapped' ? sp.radius * 1.15 : sp.radius * 0.85;
        const a = elapsed * 0.45 * sp.speed + sp.offset;
        sp.mesh.position.x = Math.cos(a) * currentRadius;
        sp.mesh.position.z = Math.sin(a) * currentRadius;
        sp.mesh.position.y =
          Math.sin(elapsed * 1.5 * sp.speed + sp.offset) * 1.1 + 0.3;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 380;
      const newH = container.clientHeight || 340;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
    };
  }, []);

  const currentPreset = SIBLING_PROMISE_PRESETS[activePresetIndex];
  const displayedBody =
    customPromiseText.trim().length > 0
      ? customPromiseText
      : currentPreset.body;

  return (
    <section
      id="gift-promise"
      className="relative py-20 border-b border-stone-200/80 bg-stone-50/60 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <Gift className="w-3.5 h-3.5 text-rose-600" />
              <span>Finale Keepsake</span>
              <span aria-hidden="true">·</span>
              <span>Interactive 3D Gift Box</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 heading-3d">
              Unwrap Your Birthday Promise, {girlfriendName}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Tap or click the 3D velvet gift box below to untie the golden satin ribbon, lift the lid, and reveal a handwritten birthday promise from {boyfriendName}.
            </p>
          </div>

          {/* Unwrap Step Progress Indicator */}
          <div className="flex items-center gap-2">
            {unwrapStage !== 'unwrapped' ? (
              <button
                type="button"
                onClick={handleInstantUnwrap}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer btn-3d-rose"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {unwrapStage === 'wrapped'
                    ? 'Unwrap 3D Gift Box Now'
                    : 'Open Box & Reveal Promise'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRewrapGift}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span>Wrap Gift Box Again</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Interactive Grid: 3D Gift Box Stage + Handwritten Digital Promise Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 3D Gift Box WebGL Stage */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div
              onPointerDown={(e) => {
                pointerDownRef.current = {
                  isDown: true,
                  startX: e.clientX,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                if (!pointerDownRef.current.isDown) return;
                const deltaX = e.clientX - pointerDownRef.current.startX;
                if (Math.abs(deltaX) > 6) {
                  pointerDownRef.current.moved = true;
                  boxVelocityRef.current = deltaX * 0.0025;
                  pointerDownRef.current.startX = e.clientX;
                }
              }}
              onPointerUp={() => {
                const wasDrag = pointerDownRef.current.moved;
                pointerDownRef.current.isDown = false;
                if (!wasDrag) {
                  handleInteractWithGiftBox();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Interactive 3D birthday gift box. Click or tap to unwrap."
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleInteractWithGiftBox();
                }
              }}
              className={`relative w-full h-[350px] sm:h-[390px] rounded-2xl bg-gradient-to-b from-rose-950/90 via-stone-900 to-stone-950 border shadow-2xl overflow-hidden cursor-pointer select-none flex flex-col justify-between p-4 group transition-all duration-300 ${
                hapticPulseActive
                  ? 'border-amber-300 ring-4 ring-amber-400/35 scale-[1.012]'
                  : 'border-rose-300/30'
              }`}
            >
              {/* Top Stage Status Bar */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 backdrop-blur-xs border border-white/15 text-[11px] font-semibold text-amber-200">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {unwrapStage === 'wrapped'
                      ? 'Step 1 of 2 · Tap to Untie Ribbon'
                      : unwrapStage === 'ribbon-untied'
                        ? 'Step 2 of 2 · Tap Again to Lift Lid!'
                        : 'Unwrapped · Birthday Promise Revealed ✨'}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1.5 text-[11px] text-stone-300 font-mono">
                  <Volume2 className="w-3 h-3 text-amber-300" />
                  <span>360° + SFX</span>
                </span>
              </div>

              {/* Three.js Canvas Mount */}
              <div
                ref={canvasContainerRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {/* Bottom Interactive Unwrap Prompt */}
              <div className="relative z-10 flex items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="text-xs text-rose-100/90 font-medium">
                  {unwrapStage === 'wrapped' && (
                    <span>
                      Touch or click the 3D gift box to untie the golden bow →
                    </span>
                  )}
                  {unwrapStage === 'ribbon-untied' && (
                    <span className="text-amber-300 font-semibold">
                      Ribbon untied! Tap the box once more to open your gift →
                    </span>
                  )}
                  {unwrapStage === 'unwrapped' && (
                    <span className="text-emerald-300 font-semibold">
                      Gift box bloomed open! Tap box anytime to replay unboxing SFX →
                    </span>
                  )}
                </div>

                {unwrapStage !== 'unwrapped' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600/80 text-white text-[11px] font-semibold shrink-0 group-hover:bg-rose-500 transition-colors">
                    <span>Tap Box</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Sensory Unboxing Audio & Haptic Feedback Bar */}
            <div className="mt-3 w-full flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white/90 border border-stone-200/90 shadow-2xs text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors ${
                    hapticPulseActive
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </span>
                <span className="font-medium text-stone-700">
                  {sensoryCueText ||
                    (supportsHaptics
                      ? 'Virtual Unboxing SFX + Haptic Vibration Ready'
                      : 'Virtual Unboxing Studio SFX Active')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  romanticAudio.playGiftUnboxing();
                  triggerUnboxingHaptics(
                    [45, 50, 85, 40, 120],
                    'Replaying Virtual Gift Unboxing Sound & Haptic Pulse'
                  );
                  boxVelocityRef.current += 0.22;
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-rose-50 hover:text-rose-800 text-stone-700 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                <Volume2 className="w-3 h-3 text-rose-600" />
                <span>Test Unboxing SFX</span>
              </button>
            </div>
          </div>

          {/* Right Column: Personalized Digital Card in Anik's Handwriting Font */}
          <div className="lg:col-span-7 perspective-1200">
            <div
              className={`relative rounded-2xl border p-6 sm:p-8 paper-texture transition-all duration-700 ${
                unwrapStage === 'unwrapped'
                  ? 'border-rose-300 shadow-2xl scale-100 opacity-100 translate-y-0 card-3d-tilt'
                  : 'border-stone-200/90 shadow-md scale-[0.98] opacity-95'
              }`}
            >
              {/* Locked / Teaser Banner before unwrapping */}
              {unwrapStage !== 'unwrapped' && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <p className="text-xs sm:text-sm text-amber-950 font-medium">
                      {unwrapStage === 'wrapped'
                        ? 'Unwrap the 3D gift box on the left to unlock the full birthday promise celebration!'
                        : 'Almost there! Tap the 3D gift box one more time to pop open the lid!'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleInstantUnwrap}
                    className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold cursor-pointer transition-colors shrink-0"
                  >
                    Unwrap Now ✨
                  </button>
                </div>
              )}

              {/* Card Top Metadata & Promise Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-200/80">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-rose-800">
                    {currentPreset.badge}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mt-0.5">
                    {currentPreset.title}
                  </h3>
                </div>

                {/* Switch between 3 Sibling Promises */}
                <div className="flex items-center gap-1.5 bg-stone-200/70 p-1 rounded-lg">
                  {SIBLING_PROMISE_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setActivePresetIndex(idx);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        activePresetIndex === idx
                          ? 'bg-white text-rose-900 shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Vow #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Handwritten Digital Promise Body (Uses Anik's Handwriting Font) */}
              <div className="mt-5">
                <div className="text-2xl sm:text-3xl text-[#1e3a8a] font-anik-handwriting font-semibold mb-2">
                  {currentPreset.salutation}
                </div>

                {isEditingCustom ? (
                  <div className="my-3">
                    <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                      Personalize Handwritten Sibling Promise:
                    </label>
                    <textarea
                      rows={4}
                      value={
                        customPromiseText || currentPreset.body
                      }
                      onChange={(e) => handleSaveCustomPromise(e.target.value)}
                      className="w-full rounded-xl border border-rose-300 bg-white/90 p-3.5 text-2xl text-[#1e3a8a] font-anik-handwriting leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      {customPromiseText && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveCustomPromise('');
                            setIsEditingCustom(false);
                          }}
                          className="px-3 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          Reset to Default Vow
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          romanticAudio.playSoftClick();
                          setIsEditingCustom(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold cursor-pointer"
                      >
                        Done Writing
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-2xl sm:text-[26px] text-[#1e3a8a] font-anik-handwriting leading-relaxed whitespace-pre-line">
                    {displayedBody}
                  </p>
                )}

                {/* Handwritten Numbered Sibling Pledges */}
                <div className="mt-5 p-4 rounded-xl bg-white/80 border border-rose-200/70">
                  <div className="text-xs font-semibold uppercase tracking-widest text-rose-800 mb-2.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-rose-600" />
                    <span>Official Birthday Pledges from {boyfriendName}:</span>
                  </div>
                  <ul className="space-y-2">
                    {currentPreset.pledgeItems.map((pledge, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-xl sm:text-2xl text-[#1e3a8a] font-anik-handwriting leading-snug"
                      >
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0 mt-1.5" />
                        <span>{pledge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Signature & Wax Seal Row */}
                <div className="mt-6 pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-2xl text-[#1e3a8a] font-anik-handwriting whitespace-pre-line leading-tight">
                    {currentPreset.signOff}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        romanticAudio.playSoftClick();
                        setIsEditingCustom((prev) => !prev);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5 text-stone-500" />
                      <span>{isEditingCustom ? 'Close Editor' : 'Edit Promise'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSealPromise}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isPromiseSealed
                          ? 'bg-emerald-700 text-white stamp-3d-redeemed'
                          : 'bg-rose-700 hover:bg-rose-800 text-white btn-3d-rose'
                      }`}
                    >
                      {isPromiseSealed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Promise Sealed Forever ♥</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Seal Promise with Wax Stamp</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
