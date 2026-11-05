import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import confetti from 'canvas-confetti';
import { Sparkles, RotateCcw, Heart, Gift, RotateCw, Eye } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface BirthdayCakeProps {
  girlfriendName: string;
  nickname: string;
  secretWishMessage: string;
}

// Reusable module-scope math objects to prevent GC in animation loop
const _mouse = new THREE.Vector2();
const _targetScale = new THREE.Vector3();

const detectSoftwareGl = (): boolean => {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
};

export const BirthdayCake: React.FC<BirthdayCakeProps> = ({
  girlfriendName,
  nickname,
  secretWishMessage,
}) => {
  const [candles, setCandles] = useState<boolean[]>([true, true, true, true, true]);
  const [showWishModal, setShowWishModal] = useState(false);
  const [hasBlownAll, setHasBlownAll] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<'isometric' | 'front' | 'top'>('isometric');

  const mountRef = useRef<HTMLDivElement | null>(null);
  const candlesStateRef = useRef<boolean[]>([true, true, true, true, true]);
  const autoRotateRef = useRef<boolean>(true);
  const cameraTargetPosRef = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    candlesStateRef.current = candles;
  }, [candles]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#fb7185', '#f59e0b', '#fbbf24', '#ffffff'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#f43f5e', '#fda4af', '#fef08a'],
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#fb7185', '#e11d48', '#fef08a'],
      });
    }, 400);
  };

  const onAllBlown = () => {
    setHasBlownAll(true);
    romanticAudio.playCelebrationChime();
    triggerConfetti();
    setTimeout(() => {
      setShowWishModal(true);
    }, 600);
  };

  const handleBlowCandle = (index: number) => {
    if (!candlesStateRef.current[index]) return;
    const next = [...candlesStateRef.current];
    next[index] = false;
    candlesStateRef.current = next;
    setCandles(next);
    romanticAudio.playSoftClick();

    if (next.every((c) => !c)) {
      onAllBlown();
    }
  };

  const handleBlowAll = () => {
    const next = [false, false, false, false, false];
    candlesStateRef.current = next;
    setCandles(next);
    onAllBlown();
  };

  const handleRelight = () => {
    const next = [true, true, true, true, true];
    candlesStateRef.current = next;
    setCandles(next);
    setHasBlownAll(false);
    romanticAudio.playSoftClick();
  };

  const handleCameraPreset = (preset: 'isometric' | 'front' | 'top') => {
    romanticAudio.playSoftClick();
    setCameraPreset(preset);
    if (preset === 'isometric') {
      cameraTargetPosRef.current = new THREE.Vector3(0, 3.8, 6.6);
    } else if (preset === 'front') {
      cameraTargetPosRef.current = new THREE.Vector3(0, 2.2, 7.2);
    } else {
      cameraTargetPosRef.current = new THREE.Vector3(0, 7.4, 2.2);
    }
  };

  // Create procedural 3D-extruded plaque texture for the front of the 3D cake
  const createPlaqueTexture = (nameText: string, subText: string, maxAnisotropy: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fffaf5';
      ctx.fillRect(0, 0, 512, 192);

      // Gold inner border with 3D bevel shadow
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 8;
      ctx.strokeRect(16, 16, 480, 160);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.strokeRect(14, 14, 480, 160);

      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw 3D extruded depth layers for "Happy Birthday, Atrayee"
      const title = `Happy Birthday, ${nameText}`;
      for (let d = 5; d >= 1; d--) {
        ctx.fillStyle = d > 2 ? '#4c0519' : '#9f1239';
        ctx.fillText(title, 256 + d * 1.2, 74 + d * 1.4);
      }
      ctx.fillStyle = '#e11d48';
      ctx.fillText(title, 256, 74);

      // Specular highlight pass
      ctx.fillStyle = '#be123c';
      ctx.font = 'italic bold 25px Georgia, serif';
      ctx.fillText(subText, 256, 130);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAnisotropy;
    return tex;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 380;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f7f0ec');
    scene.fog = new THREE.FogExp2('#f7f0ec', 0.035);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 6.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();

    // 3-Point Studio Lighting Rig (Warm Key + Cool Hemisphere Fill + Rim Light)
    const hemiLight = new THREE.HemisphereLight(0xfff1f2, 0xd6d3d1, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(4, 7, 5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 4;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xfda4af, 1.1);
    rimLight.position.set(-4, 5, -4);
    scene.add(rimLight);

    // Warm candle glow point light
    const candleGlowLight = new THREE.PointLight(0xffb703, 1.5, 8, 1.5);
    candleGlowLight.position.set(0, 3.6, 0);
    scene.add(candleGlowLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.enablePan = false;
    controls.minDistance = 4.5;
    controls.maxDistance = 10;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.target.set(0, 1.4, 0);

    controls.addEventListener('start', () => {
      cameraTargetPosRef.current = null;
    });

    // Contact Shadow Ground Plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
      grad.addColorStop(0, 'rgba(40, 25, 20, 0.38)');
      grad.addColorStop(1, 'rgba(40, 25, 20, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(5.5, 5.5),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.01;
    scene.add(contactShadow);

    // =========================================================
    // COMPOSITE 3D BIRTHDAY CAKE MODEL (10+ DISTINCT PARTS)
    // =========================================================
    const cakeRoot = new THREE.Group();
    scene.add(cakeRoot);

    // Materials (varied roughness & metalness per skill guidelines)
    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.08,
    });
    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.88,
    });
    const tier1Mat = new THREE.MeshStandardMaterial({
      color: 0xfecdd3, // Soft rose frosting
      roughness: 0.62,
      metalness: 0.02,
    });
    const tier2Mat = new THREE.MeshStandardMaterial({
      color: 0xfff1f2, // Cream vanilla tier
      roughness: 0.55,
      metalness: 0.02,
    });
    const tier3Mat = new THREE.MeshStandardMaterial({
      color: 0xfda4af, // Deeper rose berry top tier
      roughness: 0.58,
      metalness: 0.02,
    });
    const strawberryMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.3,
      metalness: 0.05,
    });

    // 1. Porcelain Pedestal Stand (Base foot + fluted column + wide platter + gold rim)
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.35, 0.22, 36), porcelainMat);
    standBase.position.y = 0.11;
    standBase.receiveShadow = true;
    cakeRoot.add(standBase);

    const standPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.55, 32), porcelainMat);
    standPillar.position.y = 0.48;
    standPillar.castShadow = true;
    cakeRoot.add(standPillar);

    const platterPlate = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.05, 0.14, 48), porcelainMat);
    platterPlate.position.y = 0.82;
    platterPlate.receiveShadow = true;
    platterPlate.castShadow = true;
    cakeRoot.add(platterPlate);

    const platterGoldRim = new THREE.Mesh(new THREE.TorusGeometry(2.22, 0.04, 16, 64), goldTrimMat);
    platterGoldRim.rotation.x = Math.PI / 2;
    platterGoldRim.position.y = 0.86;
    cakeRoot.add(platterGoldRim);

    // 2. Bottom Cake Tier (Tier 1)
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.8, 0.88, 48), tier1Mat);
    tier1.position.y = 1.33;
    tier1.castShadow = true;
    tier1.receiveShadow = true;
    cakeRoot.add(tier1);

    // Gold pearl ring around bottom tier
    const tier1Trim = new THREE.Mesh(new THREE.TorusGeometry(1.78, 0.045, 14, 48), goldTrimMat);
    tier1Trim.rotation.x = Math.PI / 2;
    tier1Trim.position.y = 0.92;
    cakeRoot.add(tier1Trim);

    // 3. Middle Cake Tier (Tier 2)
    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.34, 0.76, 48), tier2Mat);
    tier2.position.y = 2.15;
    tier2.castShadow = true;
    tier2.receiveShadow = true;
    cakeRoot.add(tier2);

    // Frosted piping scallops around Tier 2
    const scallopGeo = new THREE.SphereGeometry(0.085, 14, 14);
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dot = new THREE.Mesh(scallopGeo, tier3Mat);
      dot.position.set(Math.cos(angle) * 1.33, 1.8, Math.sin(angle) * 1.33);
      cakeRoot.add(dot);
    }

    // 4. Top Cake Tier (Tier 3)
    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.95, 0.66, 40), tier3Mat);
    tier3.position.y = 2.86;
    tier3.castShadow = true;
    tier3.receiveShadow = true;
    cakeRoot.add(tier3);

    // Top crown strawberries
    const berryGeo = new THREE.ConeGeometry(0.11, 0.22, 14);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + 0.3;
      const berry = new THREE.Mesh(berryGeo, strawberryMat);
      berry.position.set(Math.cos(angle) * 0.72, 3.29, Math.sin(angle) * 0.72);
      cakeRoot.add(berry);
    }

    // 5. Front Personalized 3D Plaque with Gold Bezel Backing
    const plaqueTex = createPlaqueTexture(
      girlfriendName || 'Atrayee',
      nickname ? `Forever ${nickname}` : '28th May Queen',
      renderer.capabilities.getMaxAnisotropy()
    );
    const plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.25,
      metalness: 0.12,
    });
    const plaqueGroup = new THREE.Group();
    plaqueGroup.position.set(0, 1.36, 1.8);
    plaqueGroup.rotation.x = -0.08;

    const plaqueGoldBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.65, 0.08),
      goldTrimMat
    );
    plaqueGoldBack.castShadow = true;
    plaqueGroup.add(plaqueGoldBack);

    const plaqueMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.56, 0.06), plaqueMat);
    plaqueMesh.position.z = 0.03;
    plaqueGroup.add(plaqueMesh);
    cakeRoot.add(plaqueGroup);

    // 5b. 3D Floating Gold Cake Topper Banner ("HAPPY BIRTHDAY ATRAYEE") above Top Tier
    const topperGroup = new THREE.Group();
    topperGroup.position.set(0, 3.88, -0.15);

    const pillarGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.78, 12);
    const leftPillar = new THREE.Mesh(pillarGeo, goldTrimMat);
    leftPillar.position.set(-0.55, -0.35, 0);
    topperGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, goldTrimMat);
    rightPillar.position.set(0.55, -0.35, 0);
    topperGroup.add(rightPillar);

    const topperBack = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.44, 0.06),
      goldTrimMat
    );
    topperGroup.add(topperBack);

    const topperFace = new THREE.Mesh(
      new THREE.BoxGeometry(1.36, 0.36, 0.07),
      plaqueMat
    );
    topperGroup.add(topperFace);
    cakeRoot.add(topperGroup);

    // 6. Five Interactive 3D Candles with 3D Flames & Click Proxies
    const candleFixtures: {
      group: THREE.Group;
      flameMesh: THREE.Mesh;
      innerCore: THREE.Mesh;
      hitBox: THREE.Mesh;
      index: number;
    }[] = [];

    const clickableHitBoxes: THREE.Object3D[] = [];
    const candleRadius = 0.42;
    const candleGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.65, 20);
    const wickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8);
    const flameGeo = new THREE.ConeGeometry(0.08, 0.24, 16);
    const hitBoxGeo = new THREE.CylinderGeometry(0.22, 0.22, 1.1, 12);
    const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });

    const wickMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 });
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const innerFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const cx = i === 0 ? 0 : Math.cos(angle) * candleRadius;
      const cz = i === 0 ? 0 : Math.sin(angle) * candleRadius;

      const cGroup = new THREE.Group();
      cGroup.position.set(cx, 3.19, cz);

      const waxMat = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xfff1f2 : 0xfde68a,
        roughness: 0.35,
        metalness: 0.05,
      });

      const body = new THREE.Mesh(candleGeo, waxMat);
      body.position.y = 0.325;
      body.castShadow = true;
      cGroup.add(body);

      const goldBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.07, 0.08, 20),
        goldTrimMat
      );
      goldBand.position.y = 0.52;
      cGroup.add(goldBand);

      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.y = 0.68;
      cGroup.add(wick);

      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.y = 0.84;
      cGroup.add(flame);

      const innerCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 10, 10),
        innerFlameMat
      );
      innerCore.position.y = 0.77;
      cGroup.add(innerCore);

      const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
      hitBox.position.y = 0.55;
      hitBox.userData = { candleIndex: i };
      cGroup.add(hitBox);
      clickableHitBoxes.push(hitBox);

      cakeRoot.add(cGroup);
      candleFixtures.push({
        group: cGroup,
        flameMesh: flame,
        innerCore,
        hitBox,
        index: i,
      });
    }

    // Raycasting for clicking individual 3D candles
    const raycaster = new THREE.Raycaster();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return; // Was an orbit drag, not a click

      const rect = renderer.domElement.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(_mouse, camera);
      const hits = raycaster.intersectObjects(clickableHitBoxes, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.candleIndex;
        if (typeof idx === 'number') {
          handleBlowCandle(idx);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 380;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop with Software WebGL Guard
    const clock = new THREE.Clock();
    let frameId = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Gentle 360 rotation when enabled
      if (autoRotateRef.current) {
        cakeRoot.rotation.y += delta * 0.42;
      }

      // Smooth camera preset damping
      if (cameraTargetPosRef.current) {
        camera.position.x = THREE.MathUtils.damp(
          camera.position.x,
          cameraTargetPosRef.current.x,
          5,
          delta
        );
        camera.position.y = THREE.MathUtils.damp(
          camera.position.y,
          cameraTargetPosRef.current.y,
          5,
          delta
        );
        camera.position.z = THREE.MathUtils.damp(
          camera.position.z,
          cameraTargetPosRef.current.z,
          5,
          delta
        );
        if (camera.position.distanceTo(cameraTargetPosRef.current) < 0.05) {
          cameraTargetPosRef.current = null;
        }
      }

      // Update 3D candle flames & light intensity
      let litCount = 0;
      candleFixtures.forEach((fixture, idx) => {
        const isLit = candlesStateRef.current[idx];
        if (isLit) {
          litCount++;
          fixture.flameMesh.visible = true;
          fixture.innerCore.visible = true;
          const flicker = 1 + Math.sin(elapsed * 14 + idx * 2.1) * 0.14;
          const sway = Math.cos(elapsed * 10 + idx) * 0.08;
          _targetScale.set(1, flicker, 1);
          fixture.flameMesh.scale.copy(_targetScale);
          fixture.flameMesh.rotation.z = sway;
        } else {
          fixture.flameMesh.visible = false;
          fixture.innerCore.visible = false;
        }
      });

      candleGlowLight.intensity = THREE.MathUtils.damp(
        candleGlowLight.intensity,
        (litCount / 5) * 1.8,
        6,
        delta
      );

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      plaqueTex.dispose();
      shadowTex.dispose();
      envMap.dispose();
      renderer.dispose();
    };
  }, [girlfriendName, nickname]);

  const remainingCandles = candles.filter(Boolean).length;

  return (
    <div className="relative flex flex-col items-center justify-between w-full rounded-2xl bg-[#f7f0ec] border border-stone-200/90 shadow-md overflow-hidden">
      {/* Top Minimal Spec Header */}
      <div className="w-full px-5 pt-4 pb-2 flex items-center justify-between gap-2 z-10">
        <div className="text-xs uppercase tracking-widest text-stone-600 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-600" />
          <span>
            {remainingCandles > 0
              ? `3D Cake · ${remainingCandles} Candle${remainingCandles > 1 ? 's' : ''} Lit`
              : 'All 5 Candles Blown Out!'}
          </span>
        </div>

        {/* Camera & Spin Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoRotate((r) => !r)}
            title="Toggle 360° Spin"
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              autoRotate
                ? 'bg-stone-900 text-white border-stone-900'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            360° Spin
          </button>
          <button
            onClick={() =>
              handleCameraPreset(
                cameraPreset === 'isometric'
                  ? 'front'
                  : cameraPreset === 'front'
                  ? 'top'
                  : 'isometric'
              )
            }
            title="Switch 3D Camera Angle"
            className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-white text-stone-700 border border-stone-300 hover:bg-stone-100 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <Eye className="w-3 h-3" />
            <span>View: {cameraPreset}</span>
          </button>
        </div>
      </div>

      {/* Dedicated Three.js 3D Viewport Container */}
      <div
        ref={mountRef}
        className="w-full h-[350px] sm:h-[380px] cursor-grab active:cursor-grabbing select-none"
      />

      {/* Bottom Control Dock */}
      <div className="w-full px-5 pb-5 pt-2 flex flex-col items-center z-10 bg-[#f7f0ec] border-t border-stone-200/60">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {remainingCandles > 0 ? (
            <button
              onClick={handleBlowAll}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-rose-700 rounded-xl hover:bg-rose-800 transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span>Make a Wish & Blow All 3D Candles</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowWishModal(true)}
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 rounded-xl hover:bg-stone-800 transition-colors shadow-xs inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Gift className="w-4 h-4 text-rose-400" />
                <span>Read Birthday Wish</span>
              </button>
              <button
                onClick={handleRelight}
                className="px-3.5 py-2.5 text-xs sm:text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-xl hover:bg-stone-50 transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Relight</span>
              </button>
            </div>
          )}
        </div>

        <p className="mt-2 text-[11px] text-stone-500 text-center">
          Drag to rotate in 3D · Tap any 3D candle flame to blow it out individually
        </p>
      </div>

      {/* Secret Wish Unlocked Modal */}
      {showWishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75">
          <div className="relative w-full max-w-lg p-6 sm:p-8 bg-stone-50 rounded-2xl border border-stone-200 shadow-2xl paper-texture">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <Heart className="w-6 h-6 fill-rose-600" />
              </div>

              <span className="text-xs uppercase tracking-widest text-rose-800 font-semibold">
                Your 28th May Birthday Wish Is Unlocked
              </span>

              <h3 className="mt-2 text-2xl font-serif font-bold text-stone-900">
                To My Awesome Older Sister, {girlfriendName}
              </h3>

              <div className="mt-4 p-5 bg-white/90 rounded-xl border border-stone-200/70 text-left">
                <p className="font-script text-lg text-stone-800 leading-relaxed italic">
                  "{secretWishMessage}"
                </p>
                <div className="mt-4 text-right">
                  <span className="text-xs font-serif font-medium text-stone-600">
                    With endless sibling pride — Anik
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setShowWishModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Keep This Wish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
