import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Send,
  Sparkles,
  Eye,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Memory } from '../types';
import { romanticAudio } from '../utils/audioSynth';
import { compressImageFile, idbGet, idbSet } from '../utils/persistentStorage';

interface Lantern3DData {
  group: THREE.Group;
  vx: number;
  vy: number;
  vz: number;
  swayPhase: number;
  lanternIndex: number;
}

export interface LanternPhotoSlot {
  id: string;
  title: string;
  date: string;
  caption: string;
  imageUrl: string;
  wishText: string;
  isFromTimeline?: boolean;
}

interface LanternWishCanvasProps {
  memories?: Memory[];
  onUpdateMemoryImage?: (id: string, dataUrl: string) => void;
  onRemoveMemoryImage?: (id: string) => void;
}

const IDB_LANTERN_PHOTOS_KEY = 'amore_lantern_photos_permanent_v1';

const DEFAULT_LANTERN_SLOTS: LanternPhotoSlot[] = [
  {
    id: 'lantern-slot-1',
    title: 'Starlight Over Bangalore & Home',
    date: 'Night Sky Memory 01',
    caption:
      'Tap any glowing lantern in the night sky to reveal a cherished sisterhood picture! Upload a special night-sky photo here and it stays forever.',
    imageUrl: '',
    wishText: 'Happy 28th May, Atrayee Didi!',
  },
  {
    id: 'lantern-slot-2',
    title: 'Kali Pujo Lights & Late-Night Talks',
    date: 'Night Sky Memory 02',
    caption:
      'From Kali Pujo evenings to 3:30 AM Magnum & movie marathons — every lantern in this sky carries a memory of us.',
    imageUrl: '',
    wishText: 'May your Bangalore internship shine bright!',
  },
  {
    id: 'lantern-slot-3',
    title: 'Best Big Sister in the Universe',
    date: 'Night Sky Memory 03',
    caption:
      'Even when you get super busy at NIT and forget to call, your little brother Anik is always cheering for you.',
    imageUrl: '',
    wishText: 'Endless joy, health & success always',
  },
];

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();

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

export const LanternWishCanvas: React.FC<LanternWishCanvasProps> = ({
  memories = [],
  onUpdateMemoryImage,
  onRemoveMemoryImage,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [wishInput, setWishInput] = useState('');
  const [releasedWishes, setReleasedWishes] = useState<string[]>([
    'Happy 28th May, Atrayee!',
    'Best older sister in the universe',
    'Endless joy, health & success',
  ]);

  const [customLanternSlots, setCustomLanternSlots] = useState<LanternPhotoSlot[]>(() => {
    try {
      const saved = localStorage.getItem(IDB_LANTERN_PHOTOS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_LANTERN_SLOTS;
  });

  // Load permanent lantern photos from IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    async function loadFromIdb() {
      const saved = await idbGet<LanternPhotoSlot[]>(IDB_LANTERN_PHOTOS_KEY);
      if (mounted && Array.isArray(saved) && saved.length > 0) {
        setCustomLanternSlots(saved);
      }
    }
    void loadFromIdb();
    return () => {
      mounted = false;
    };
  }, []);

  const saveCustomLanternSlots = (nextSlots: LanternPhotoSlot[]) => {
    setCustomLanternSlots(nextSlots);
    void idbSet(IDB_LANTERN_PHOTOS_KEY, nextSlots);
    try {
      localStorage.setItem(IDB_LANTERN_PHOTOS_KEY, JSON.stringify(nextSlots));
    } catch {}
  };

  // Combine Memories section cards + dedicated Night Sky Lantern slots so tapping any lantern reveals a rich photo card
  const combinedPhotoDeck: LanternPhotoSlot[] = [
    ...customLanternSlots,
    ...memories.map((m, idx) => ({
      id: m.id,
      title: m.title,
      date: m.date,
      caption: m.caption,
      imageUrl: m.imageUrl || '',
      wishText: releasedWishes[idx % releasedWishes.length] || 'Happy Birthday Atrayee Didi!',
      isFromTimeline: true,
    })),
  ];

  const [activeLanternCardIndex, setActiveLanternCardIndex] = useState<number | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const spawnLanternRef = useRef<((wishText: string) => void) | null>(null);
  const deckLengthRef = useRef<number>(combinedPhotoDeck.length);
  deckLengthRef.current = combinedPhotoDeck.length;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 800;
    const height = 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d1a');
    scene.fog = new THREE.FogExp2('#090d1a', 0.03);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 120);
    camera.position.set(0, 1.5, 13);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    pmremGenerator.dispose();

    const hemiLight = new THREE.HemisphereLight(0x312e81, 0x0f172a, 0.95);
    scene.add(hemiLight);

    const warmKey = new THREE.DirectionalLight(0xfbbf24, 1.25);
    warmKey.position.set(6, 10, 8);
    scene.add(warmKey);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 0.35;

    // 1. InstancedMesh 3D Starfield
    const starCount = 160;
    const starGeo = new THREE.OctahedronGeometry(0.08, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starField = new THREE.InstancedMesh(starGeo, starMat, starCount);

    for (let i = 0; i < starCount; i++) {
      _dummy.position.set(
        (Math.random() - 0.5) * 42,
        (Math.random() - 0.5) * 24,
        -6 - Math.random() * 20
      );
      const scale = 0.5 + Math.random() * 1.3;
      _dummy.scale.set(scale, scale, scale);
      _dummy.updateMatrix();
      starField.setMatrixAt(i, _dummy.matrix);
      _color.setHSL(0.1 + Math.random() * 0.15, 0.8, 0.85);
      starField.setColorAt(i, _color);
    }
    starField.instanceMatrix.needsUpdate = true;
    if (starField.instanceColor) starField.instanceColor.needsUpdate = true;
    starField.computeBoundingSphere();
    scene.add(starField);

    // Shared geometries & materials for Composite 3D Paper Lanterns
    const lanternShellGeo = new THREE.CylinderGeometry(0.52, 0.38, 1.22, 16);
    const topCapGeo = new THREE.ConeGeometry(0.54, 0.24, 16);
    const bottomRingGeo = new THREE.TorusGeometry(0.38, 0.035, 10, 24);
    const coreFlameGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const tasselGeo = new THREE.CylinderGeometry(0.025, 0.055, 0.48, 8);
    const photoFrameGeo = new THREE.BoxGeometry(0.42, 0.52, 0.03);

    const bambooMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.75,
      metalness: 0.1,
    });
    const goldWireMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const coreFlameMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const lanterns: Lantern3DData[] = [];

    const createCompositeLantern = (
      x: number,
      y: number,
      z: number,
      hueOffset: number = 0,
      idx: number = 0
    ) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.userData = { lanternIndex: idx };

      const paperMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.08 + hueOffset, 0.95, 0.58),
        emissive: new THREE.Color().setHSL(0.07 + hueOffset, 0.95, 0.45),
        emissiveIntensity: 1.4,
        roughness: 0.42,
        metalness: 0.05,
      });
      const body = new THREE.Mesh(lanternShellGeo, paperMat);
      body.userData = { lanternIndex: idx };
      group.add(body);

      const topCap = new THREE.Mesh(topCapGeo, bambooMat);
      topCap.position.y = 0.68;
      topCap.userData = { lanternIndex: idx };
      group.add(topCap);

      const bottomRim = new THREE.Mesh(bottomRingGeo, bambooMat);
      bottomRim.rotation.x = Math.PI / 2;
      bottomRim.position.y = -0.6;
      bottomRim.userData = { lanternIndex: idx };
      group.add(bottomRim);

      const core = new THREE.Mesh(coreFlameGeo, coreFlameMat);
      core.position.y = -0.2;
      core.userData = { lanternIndex: idx };
      group.add(core);

      const tassel = new THREE.Mesh(tasselGeo, goldWireMat);
      tassel.position.y = -0.85;
      tassel.userData = { lanternIndex: idx };
      group.add(tassel);

      // Hanging Polaroid Memory Tag underneath each lantern
      const wishTag = new THREE.Mesh(photoFrameGeo, paperMat);
      wishTag.position.y = -1.18;
      wishTag.userData = { lanternIndex: idx };
      group.add(wishTag);

      scene.add(group);
      lanterns.push({
        group,
        vx: (Math.random() - 0.5) * 0.22,
        vy: 0.38 + Math.random() * 0.3,
        vz: (Math.random() - 0.5) * 0.14,
        swayPhase: Math.random() * Math.PI * 2,
        lanternIndex: idx,
      });
    };

    for (let i = 0; i < 10; i++) {
      createCompositeLantern(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (i % 4) * 0.018,
        i
      );
    }

    spawnLanternRef.current = () => {
      createCompositeLantern(
        (Math.random() - 0.5) * 4,
        -4.2,
        1 + (Math.random() - 0.5) * 2,
        Math.random() * 0.04,
        lanterns.length
      );
    };

    // Raycaster so tapping a 3D lantern in the night sky opens its floating Memory Picture Card
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      // Ignore camera orbit drags
      if (dx > 8 || dy > 8) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const lanternMeshes: THREE.Object3D[] = [];
      lanterns.forEach((l) => {
        l.group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            lanternMeshes.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(lanternMeshes, false);
      if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        const lanternIdx =
          typeof hitObj.userData?.lanternIndex === 'number'
            ? hitObj.userData.lanternIndex
            : 0;
        const totalCards = Math.max(1, deckLengthRef.current);
        setActiveLanternCardIndex(lanternIdx % totalCards);
        romanticAudio.playCelebrationChime();
      } else {
        // Even if they tap near a lantern in the night sky, spawn a glowing lantern AND open a memory photo card
        if (spawnLanternRef.current) {
          spawnLanternRef.current('✨');
        }
        const totalCards = Math.max(1, deckLengthRef.current);
        const randomCard = Math.floor(Math.random() * totalCards);
        setActiveLanternCardIndex(randomCard);
        romanticAudio.playSoftClick();
      }
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    domElem.addEventListener('pointerup', onPointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

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

      lanterns.forEach((l, idx) => {
        l.group.position.y += l.vy * delta;
        l.group.position.x +=
          Math.sin(elapsed * 1.2 + l.swayPhase) * 0.35 * delta + l.vx * delta;
        l.group.rotation.y += delta * 0.4;
        l.group.rotation.z = Math.sin(elapsed * 1.5 + idx) * 0.08;

        if (l.group.position.y > 6.5) {
          l.group.position.y = -5.5;
          l.group.position.x = (Math.random() - 0.5) * 14;
        }
      });

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
      domElem.removeEventListener('pointerdown', onPointerDown);
      domElem.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      starGeo.dispose();
      starMat.dispose();
      lanternShellGeo.dispose();
      topCapGeo.dispose();
      bottomRingGeo.dispose();
      coreFlameGeo.dispose();
      tasselGeo.dispose();
      photoFrameGeo.dispose();
      envMap.dispose();
      renderer.dispose();
    };
  }, []);

  const handleReleaseWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishInput.trim()) return;

    if (spawnLanternRef.current) {
      spawnLanternRef.current(wishInput.trim());
    }
    setReleasedWishes((prev) => [wishInput.trim(), ...prev.slice(0, 5)]);
    setWishInput('');
    romanticAudio.playCelebrationChime();
  };

  const activeCard =
    activeLanternCardIndex !== null
      ? combinedPhotoDeck[activeLanternCardIndex % combinedPhotoDeck.length]
      : null;

  const handleUploadPhotoToActiveLantern = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeCard) return;

    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1400, 0.85);
      if (activeCard.isFromTimeline && onUpdateMemoryImage) {
        onUpdateMemoryImage(activeCard.id, compressedDataUrl);
      } else {
        const exists = customLanternSlots.some((s) => s.id === activeCard.id);
        if (exists) {
          const updated = customLanternSlots.map((s) =>
            s.id === activeCard.id ? { ...s, imageUrl: compressedDataUrl } : s
          );
          saveCustomLanternSlots(updated);
        } else {
          const newSlot: LanternPhotoSlot = {
            ...activeCard,
            id: `lantern-custom-${Date.now()}`,
            imageUrl: compressedDataUrl,
            isFromTimeline: false,
          };
          saveCustomLanternSlots([newSlot, ...customLanternSlots]);
          setActiveLanternCardIndex(0);
        }
      }
      romanticAudio.playCelebrationChime();
    } catch (err) {
      console.error('Failed to upload lantern photo', err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleRemoveActiveLanternPhoto = () => {
    if (!activeCard) return;
    romanticAudio.playSoftClick();
    if (activeCard.isFromTimeline && onRemoveMemoryImage) {
      onRemoveMemoryImage(activeCard.id);
    } else {
      const updated = customLanternSlots.map((s) =>
        s.id === activeCard.id ? { ...s, imageUrl: '' } : s
      );
      saveCustomLanternSlots(updated);
    }
  };

  const handleAddNewLanternPhotoSlot = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1400, 0.85);
      const newSlot: LanternPhotoSlot = {
        id: `lantern-sky-${Date.now()}`,
        title: `Night Sky Lantern Memory #${customLanternSlots.length + 1}`,
        date: '28th May Keepsake',
        caption:
          'A special memory illuminated under the 3D birthday lantern sky for Atrayee Didi.',
        imageUrl: compressedDataUrl,
        wishText: 'Shining bright in the night sky ✨',
      };
      const updated = [newSlot, ...customLanternSlots];
      saveCustomLanternSlots(updated);
      setActiveLanternCardIndex(0);
      romanticAudio.playCelebrationChime();
    } catch (err) {
      console.error('Failed to add new lantern photo', err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <section
      id="lantern-sky"
      className="py-20 border-b border-stone-200/80 bg-stone-900 text-white"
    >
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">
            <span>Chapter 08</span>
            <span aria-hidden="true">·</span>
            <span>Interactive 3D Night Sky & Lantern Pictures</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white heading-3d-light">
            Tap a 3D Lantern to Reveal Night Sky Memories
          </h2>
          <p className="mt-2 text-sm text-stone-300 font-sans">
            Tap or click any glowing lantern floating in the 3D night sky to open a hidden memory picture card, or upload new lantern photos that stay forever.
          </p>

          {/* Quick action bar to open or upload lantern photos */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveLanternCardIndex(0);
                romanticAudio.playCelebrationChime();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold transition-all cursor-pointer shadow-md"
            >
              <ImageIcon className="w-4 h-4" />
              <span>View Lantern Memory Pictures ({combinedPhotoDeck.length})</span>
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-300 text-xs font-semibold transition-all cursor-pointer">
              <Camera className="w-4 h-4" />
              <span>{isUploadingPhoto ? 'Saving Photo...' : 'Add Night Lantern Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAddNewLanternPhotoSlot}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Interactive 3D Sky Container */}
        <div className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-[#090d1a]">
          <div
            ref={mountRef}
            className="w-full h-[460px] cursor-pointer"
          />

          <div className="absolute top-3 left-4 text-[11px] text-stone-200 font-sans pointer-events-none flex items-center gap-1.5 bg-stone-950/85 px-3.5 py-1.5 rounded-lg border border-amber-500/30 shadow-md">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Tap Any 3D Lantern in the Night Sky to Reveal a Memory Picture · Drag to Orbit</span>
          </div>

          {/* Floating Night-View Lantern Memory Photo Card Overlay when a lantern is tapped */}
          {activeCard && activeLanternCardIndex !== null && (
            <div className="absolute inset-0 z-20 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
              <div className="relative w-full max-w-md bg-stone-900 border border-amber-400/40 rounded-2xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)] text-white">
                {/* Top bar */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      Lantern Memory {(activeLanternCardIndex % combinedPhotoDeck.length) + 1} of{' '}
                      {combinedPhotoDeck.length}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveLanternCardIndex(null)}
                    className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
                    title="Close Lantern Photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Polaroid Frame inside the Night Sky */}
                <div className="relative rounded-xl overflow-hidden bg-stone-950 border border-stone-800 aspect-[4/3] mb-4 flex items-center justify-center group">
                  {activeCard.imageUrl ? (
                    <>
                      <img
                        src={activeCard.imageUrl}
                        alt={activeCard.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-900/85 hover:bg-stone-900 text-amber-300 text-[11px] font-medium flex items-center gap-1 border border-stone-700 cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveActiveLanternPhoto}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 text-rose-200 text-[11px] font-medium flex items-center gap-1 border border-rose-800/60 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-3">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="font-serif text-base font-bold text-amber-200 mb-1">
                        {activeCard.title}
                      </p>
                      <p className="text-xs text-stone-400 max-w-xs mb-4">
                        Upload a favorite sibling photo to glow inside this 3D night lantern forever.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Photo to This Lantern</span>
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPhotoToActiveLantern}
                    className="hidden"
                  />
                </div>

                {/* Caption & Hand-written style note */}
                <div className="mb-4">
                  <div className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">
                    {activeCard.date}
                  </div>
                  <h3 className="text-lg font-serif font-bold text-white mt-0.5">
                    {activeCard.title}
                  </h3>
                  <p className="text-sm text-stone-300 mt-1.5 leading-relaxed">
                    {activeCard.caption}
                  </p>
                  <div className="mt-2.5 pt-2.5 border-t border-stone-800 text-amber-300 font-anik-handwriting text-lg">
                    ✨ "{activeCard.wishText}"
                  </div>
                </div>

                {/* Prev / Next Lantern buttons */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      romanticAudio.playSoftClick();
                      setActiveLanternCardIndex(
                        (prev) =>
                          ((prev ?? 0) - 1 + combinedPhotoDeck.length) %
                          combinedPhotoDeck.length
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev Lantern</span>
                  </button>

                  <span className="text-[11px] text-stone-400">
                    Saved Permanently
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      romanticAudio.playSoftClick();
                      setActiveLanternCardIndex(
                        (prev) => ((prev ?? 0) + 1) % combinedPhotoDeck.length
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs font-medium text-stone-200 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next Lantern</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unified Bottom Dock for Releasing a 3D Wish Lantern */}
          <div className="p-4 bg-stone-950 border-t border-stone-800">
            <form
              onSubmit={handleReleaseWish}
              className="max-w-lg mx-auto flex items-center gap-2 p-1.5 bg-stone-900 rounded-xl border border-stone-700/80"
            >
              <input
                type="text"
                value={wishInput}
                onChange={(e) => setWishInput(e.target.value)}
                placeholder="Write a birthday wish for Atrayee..."
                maxLength={60}
                className="flex-1 px-4 py-2 text-xs sm:text-sm bg-transparent text-white placeholder-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!wishInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span>Launch 3D Lantern</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Recently released wishes list */}
        {releasedWishes.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-stone-400">
            <span className="text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Floating 3D Wishes:
            </span>
            {releasedWishes.map((w, idx) => (
              <span
                key={idx}
                className="text-stone-300 italic flex items-center gap-1.5"
              >
                <span>"{w}"</span>
                {idx < releasedWishes.length - 1 && (
                  <span aria-hidden="true" className="text-stone-600">
                    ·
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
