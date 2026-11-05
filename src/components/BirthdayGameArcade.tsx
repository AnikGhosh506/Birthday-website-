import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Heart,
  HelpCircle,
  CheckCircle2,
  Layers,
  Type,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { romanticAudio } from '../utils/audioSynth';

type GameMode = 'STARLIGHT_CATCHER' | 'MEMORY_MATCH' | 'WORD_CIPHER';
type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

interface BirthdayGameArcadeProps {
  girlfriendName: string;
  boyfriendName: string;
  onUnlockBonusCoupon?: () => void;
  bonusUnlocked?: boolean;
}

// ==========================================
// 1. 3D STARLIGHT CATCHER TYPES & CONSTANTS
// ==========================================
type ItemType = 'LETTER' | 'CUPCAKE' | 'STAR' | 'ROSE_HEAL' | 'CLOUD_HAZARD';

interface Falling3DItem {
  id: number;
  meshGroup: THREE.Group;
  x: number;
  y: number;
  speed: number;
  wobbleSpeed: number;
  wobbleOffset: number;
  rotSpeedX: number;
  rotSpeedY: number;
  type: ItemType;
}

interface Burst3DParticle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  life: number;
}

interface HudPopup {
  id: number;
  text: string;
  color: string;
}

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

// ==========================================
// 2. MEMORY MATCH CARD DATA
// ==========================================
interface MemoryCard {
  uid: string;
  pairId: string;
  title: string;
  symbol: string;
  subtitle: string;
  accentColor: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const MEMORY_PAIRS = [
  { pairId: 'cake', title: 'Birthday Cake', symbol: '🎂', subtitle: '28th May Wish', accentColor: '#d97706' },
  { pairId: 'crown', title: 'Queen Big Sis', symbol: '👑', subtitle: 'Always iconic', accentColor: '#e11d48' },
  { pairId: 'coffee', title: 'Iced Coffee Run', symbol: '☕', subtitle: 'Sister treat', accentColor: '#78350f' },
  { pairId: 'camera', title: 'Sister Selfie', symbol: '📸', subtitle: 'Best angles', accentColor: '#0f766e' },
  { pairId: 'shopping', title: 'Closet Raid', symbol: '🛍️', subtitle: 'Borrowed style', accentColor: '#be123c' },
  { pairId: 'snacks', title: 'Midnight Snacks', symbol: '🍕', subtitle: 'Kitchen talks', accentColor: '#ea580c' },
  { pairId: 'letter', title: 'Sister Note', symbol: '💌', subtitle: 'Partner in crime', accentColor: '#4f46e5' },
  { pairId: 'gift', title: 'Birthday Surprise', symbol: '🎁', subtitle: 'For Atrayee', accentColor: '#6d28d9' },
];

// ==========================================
// 3. WORD CIPHER PUZZLES
// ==========================================
interface WordPuzzle {
  word: string;
  category: string;
  clue: string;
  sweetNote: string;
}

const WORD_PUZZLES: WordPuzzle[] = [
  {
    word: 'ATRAYEE',
    category: 'The Birthday Star · 28th May',
    clue: 'The coolest, wisest, and most extraordinary older sister in the universe.',
    sweetNote: 'Happy Birthday, Atrayee! So grateful to have you as my big sister.',
  },
  {
    word: 'SISTERHOOD',
    category: 'Lifetime Bond',
    clue: 'A built-in lifelong friendship full of inside jokes, shared secrets, and unconditional support.',
    sweetNote: 'Having you as my older sister is the best gift our family ever gave me.',
  },
  {
    word: 'ROLEMODEL',
    category: 'Inspiration',
    clue: 'Someone who leads the way with grace, courage, and wisdom for her younger sibling.',
    sweetNote: 'I have looked up to you since we were kids, and I always will.',
  },
  {
    word: 'BESTFRIEND',
    category: 'Partner in Crime',
    clue: 'What an older sister naturally becomes when you grow up sharing every laugh together.',
    sweetNote: 'No matter where life takes us, you will always be my first best friend.',
  },
  {
    word: 'LAUGHTER',
    category: 'Everyday Magic',
    clue: 'What happens immediately when we make eye contact across the room at family gatherings.',
    sweetNote: 'Nobody makes me laugh as hard as you do, big sis!',
  },
  {
    word: 'CHAMPION',
    category: 'Big Sis Energy',
    clue: 'Someone who always has your back, defends you, and cheers for your biggest dreams.',
    sweetNote: 'Thank you for always having my back through thick and thin!',
  },
];

function scrambleWord(word: string): string[] {
  const arr = word.split('');
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    if (arr.join('') !== word) break;
  }
  return arr;
}

export const BirthdayGameArcade: React.FC<BirthdayGameArcadeProps> = ({
  girlfriendName,
  boyfriendName,
  onUnlockBonusCoupon,
  bonusUnlocked = false,
}) => {
  const [activeMode, setActiveMode] = useState<GameMode>('STARLIGHT_CATCHER');
  const [totalArcadePoints, setTotalArcadePoints] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('amore_arcade_points') || '0');
    } catch {
      return 0;
    }
  });

  const addArcadePoints = useCallback((pts: number) => {
    setTotalArcadePoints((prev) => {
      const next = prev + pts;
      try {
        localStorage.setItem('amore_arcade_points', String(next));
      } catch {}
      return next;
    });
  }, []);

  // =========================================================
  // GAME 1: 3D STARLIGHT CATCHER (THREE.JS WEBGL 3D SCENE)
  // =========================================================
  const mount3DRef = useRef<HTMLDivElement | null>(null);
  const [catcherState, setCatcherState] = useState<GameState>('TITLE_MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('amore_catcher_highscore') || '0');
    } catch {
      return 0;
    }
  });
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [wave, setWave] = useState(1);
  const [caughtCount, setCaughtCount] = useState(0);
  const [lastCatchBanner, setLastCatchBanner] = useState<HudPopup | null>(null);

  const gameRef = useRef<{
    playerX: number;
    targetX: number;
    keys: { left: boolean; right: boolean };
    score: number;
    lives: number;
    combo: number;
    wave: number;
    caughtCount: number;
    lastSpawnTime: number;
    nextItemId: number;
  }>({
    playerX: 0,
    targetX: 0,
    keys: { left: false, right: false },
    score: 0,
    lives: 3,
    combo: 1,
    wave: 1,
    caughtCount: 0,
    lastSpawnTime: 0,
    nextItemId: 1,
  });

  const startCatcherGame = () => {
    romanticAudio.playSoftClick();
    gameRef.current = {
      playerX: 0,
      targetX: 0,
      keys: { left: false, right: false },
      score: 0,
      lives: 3,
      combo: 1,
      wave: 1,
      caughtCount: 0,
      lastSpawnTime: performance.now(),
      nextItemId: 1,
    };
    setScore(0);
    setLives(3);
    setCombo(1);
    setWave(1);
    setCaughtCount(0);
    setLastCatchBanner(null);
    setCatcherState('PLAYING');
  };

  const togglePauseCatcher = () => {
    romanticAudio.playSoftClick();
    setCatcherState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
  };

  // Keyboard listener for 3D Starlight Catcher
  useEffect(() => {
    if (activeMode !== 'STARLIGHT_CATCHER' || catcherState !== 'PLAYING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        gameRef.current.keys.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        gameRef.current.keys.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeMode, catcherState]);

  // Three.js WebGL 3D Scene for Starlight Wish Catcher
  useEffect(() => {
    if (activeMode !== 'STARLIGHT_CATCHER') return;
    const container = mount3DRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 760;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d1a');
    scene.fog = new THREE.FogExp2('#090d1a', 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 12.5);
    camera.lookAt(0, 0, 0);

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

    // 3-Point Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xfda4af, 0x1e1b4b, 0.95);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    keyLight.position.set(5, 9, 7);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-6, 4, -5);
    scene.add(rimLight);

    // 1. 3D Starfield Background (InstancedMesh)
    const starCount = 120;
    const starBgGeo = new THREE.OctahedronGeometry(0.06, 0);
    const starBgMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starField = new THREE.InstancedMesh(starBgGeo, starBgMat, starCount);
    for (let i = 0; i < starCount; i++) {
      _dummy.position.set(
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 14,
        -3 - Math.random() * 10
      );
      const s = 0.6 + Math.random() * 1.1;
      _dummy.scale.set(s, s, s);
      _dummy.updateMatrix();
      starField.setMatrixAt(i, _dummy.matrix);
      _color.setHSL(0.12 + Math.random() * 0.7, 0.8, 0.85);
      starField.setColorAt(i, _color);
    }
    starField.instanceMatrix.needsUpdate = true;
    if (starField.instanceColor) starField.instanceColor.needsUpdate = true;
    scene.add(starField);

    // 2. 3D Stage Grid Floor
    const gridHelper = new THREE.GridHelper(24, 24, 0xf43f5e, 0x312e81);
    gridHelper.position.y = -3.85;
    scene.add(gridHelper);

    // 3. Composite 3D Player Keepsake Basket (5 parts)
    const basketGroup = new THREE.Group();
    const basketY = -3.1;
    basketGroup.position.set(0, basketY, 0);
    scene.add(basketGroup);

    const basketBodyMat = new THREE.MeshStandardMaterial({
      color: 0xfff1f2,
      roughness: 0.3,
      metalness: 0.1,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.22,
      metalness: 0.88,
    });
    const velvetMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.7,
      metalness: 0.05,
    });

    const trayBase = new THREE.Mesh(
      new THREE.CylinderGeometry(1.35, 1.05, 0.55, 32),
      basketBodyMat
    );
    basketGroup.add(trayBase);

    const goldRim = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 14, 40), goldMat);
    goldRim.rotation.x = Math.PI / 2;
    goldRim.position.y = 0.27;
    basketGroup.add(goldRim);

    const innerCushion = new THREE.Mesh(
      new THREE.CylinderGeometry(1.22, 1.0, 0.15, 28),
      velvetMat
    );
    innerCushion.position.y = 0.22;
    basketGroup.add(innerCushion);

    // Side golden handles
    const handleLeft = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 10, 20), goldMat);
    handleLeft.position.set(-1.38, 0.08, 0);
    basketGroup.add(handleLeft);

    const handleRight = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 10, 20), goldMat);
    handleRight.position.set(1.38, 0.08, 0);
    basketGroup.add(handleRight);

    // Shared Geometries & Materials for Falling 3D Items
    const envBoxGeo = new THREE.BoxGeometry(0.75, 0.5, 0.12);
    const sealGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.15, 16);
    const cupBaseGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.38, 16);
    const frostingGeo = new THREE.SphereGeometry(0.34, 16, 16);
    const cherryGeo = new THREE.SphereGeometry(0.11, 12, 12);
    const starOctGeo = new THREE.OctahedronGeometry(0.42, 0);
    const starRingGeo = new THREE.TorusGeometry(0.55, 0.035, 10, 24);
    const cloudSphereGeo = new THREE.SphereGeometry(0.32, 14, 14);
    const boltGeo = new THREE.ConeGeometry(0.14, 0.42, 6);
    const particleGeo = new THREE.OctahedronGeometry(0.09, 0);

    const envPaperMat = new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.4 });
    const sealRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.25, metalness: 0.2 });
    const frostingPinkMat = new THREE.MeshStandardMaterial({ color: 0xfda4af, roughness: 0.45 });
    const starGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85,
    });
    const healEmeraldMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      roughness: 0.2,
      metalness: 0.5,
    });
    const cloudDarkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
      metalness: 0.1,
    });

    const create3DCollectible = (type: ItemType): THREE.Group => {
      const g = new THREE.Group();
      if (type === 'LETTER') {
        const env = new THREE.Mesh(envBoxGeo, envPaperMat);
        g.add(env);
        const seal = new THREE.Mesh(sealGeo, sealRedMat);
        seal.rotation.x = Math.PI / 2;
        seal.position.z = 0.03;
        g.add(seal);
      } else if (type === 'CUPCAKE') {
        const base = new THREE.Mesh(cupBaseGeo, goldMat);
        base.position.y = -0.15;
        g.add(base);
        const dome = new THREE.Mesh(frostingGeo, frostingPinkMat);
        dome.position.y = 0.12;
        g.add(dome);
        const cherry = new THREE.Mesh(cherryGeo, sealRedMat);
        cherry.position.y = 0.44;
        g.add(cherry);
      } else if (type === 'STAR') {
        const star = new THREE.Mesh(starOctGeo, starGoldMat);
        g.add(star);
        const halo = new THREE.Mesh(starRingGeo, goldMat);
        g.add(halo);
      } else if (type === 'ROSE_HEAL') {
        const gem = new THREE.Mesh(starOctGeo, healEmeraldMat);
        g.add(gem);
        const ring = new THREE.Mesh(starRingGeo, healEmeraldMat);
        ring.rotation.x = Math.PI / 3;
        g.add(ring);
      } else {
        // CLOUD_HAZARD
        const c1 = new THREE.Mesh(cloudSphereGeo, cloudDarkMat);
        c1.position.set(-0.24, 0.05, 0);
        g.add(c1);
        const c2 = new THREE.Mesh(cloudSphereGeo, cloudDarkMat);
        c2.scale.set(1.2, 1.2, 1.2);
        c2.position.set(0, 0.16, 0);
        g.add(c2);
        const c3 = new THREE.Mesh(cloudSphereGeo, cloudDarkMat);
        c3.position.set(0.24, 0.05, 0);
        g.add(c3);
        const bolt = new THREE.Mesh(boltGeo, starGoldMat);
        bolt.rotation.x = Math.PI;
        bolt.position.y = -0.28;
        g.add(bolt);
      }
      return g;
    };

    const active3DItems: Falling3DItem[] = [];
    const active3DParticles: Burst3DParticle[] = [];

    const spawn3DBurst = (x: number, y: number, hexColor: number) => {
      const pMat = new THREE.MeshBasicMaterial({ color: hexColor });
      for (let i = 0; i < 10; i++) {
        const mesh = new THREE.Mesh(particleGeo, pMat);
        mesh.position.set(x, y, 0);
        scene.add(mesh);
        const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
        const spd = 2.5 + Math.random() * 3.5;
        active3DParticles.push({
          mesh,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd,
          vz: (Math.random() - 0.5) * 3,
          life: 1.0,
        });
      }
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 760;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
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
      const now = performance.now();
      const state = gameRef.current;

      if (catcherState === 'PLAYING') {
        // 1. Update 3D Basket X Position & Tilt
        const maxStageX = 5.4;
        if (state.keys.left) {
          state.targetX = Math.max(-maxStageX, state.playerX - 10 * delta);
        }
        if (state.keys.right) {
          state.targetX = Math.min(maxStageX, state.playerX + 10 * delta);
        }
        state.playerX = THREE.MathUtils.damp(state.playerX, state.targetX, 12, delta);
        state.playerX = Math.max(-maxStageX, Math.min(maxStageX, state.playerX));

        basketGroup.position.x = state.playerX;
        const tiltZ = Math.max(-0.28, Math.min(0.28, -(state.targetX - state.playerX) * 0.18));
        basketGroup.rotation.z = THREE.MathUtils.damp(basketGroup.rotation.z, tiltZ, 10, delta);
        basketGroup.rotation.y = Math.sin(now * 0.002) * 0.15;

        // 2. Spawn 3D Falling Collectibles
        const spawnInterval = Math.max(440, 1050 - (state.wave - 1) * 95);
        if (now - state.lastSpawnTime > spawnInterval) {
          state.lastSpawnTime = now;
          const roll = Math.random();
          let type: ItemType = 'LETTER';
          if (roll < 0.18) {
            type = 'CLOUD_HAZARD';
          } else if (roll < 0.32) {
            type = 'STAR';
          } else if (roll < 0.56) {
            type = 'CUPCAKE';
          } else if (roll < 0.64 && state.lives < 3) {
            type = 'ROSE_HEAL';
          }

          const meshGroup = create3DCollectible(type);
          const spawnX = (Math.random() - 0.5) * 10.2;
          const spawnY = 4.6;
          meshGroup.position.set(spawnX, spawnY, 0);
          scene.add(meshGroup);

          const baseSpeed = 3.2 + state.wave * 0.45 + Math.random() * 1.4;
          active3DItems.push({
            id: state.nextItemId++,
            meshGroup,
            x: spawnX,
            y: spawnY,
            speed: type === 'STAR' ? baseSpeed * 1.2 : baseSpeed,
            wobbleSpeed: 1.5 + Math.random() * 1.5,
            wobbleOffset: Math.random() * Math.PI * 2,
            rotSpeedX: (Math.random() - 0.5) * 2.5,
            rotSpeedY: 1.4 + Math.random() * 2.2,
            type,
          });
        }

        // 3. Update Falling 3D Items & Check Collision with 3D Basket
        for (let i = active3DItems.length - 1; i >= 0; i--) {
          const item = active3DItems[i];
          item.y -= item.speed * delta;
          const drawX = item.x + Math.sin(item.y * 0.7 + item.wobbleOffset) * 0.35;
          item.meshGroup.position.set(drawX, item.y, 0);
          item.meshGroup.rotation.x += item.rotSpeedX * delta;
          item.meshGroup.rotation.y += item.rotSpeedY * delta;

          const hitX = Math.abs(drawX - state.playerX) < 1.48;
          const hitY = Math.abs(item.y - basketY) < 0.72;

          if (hitX && hitY) {
            scene.remove(item.meshGroup);
            active3DItems.splice(i, 1);

            if (item.type === 'CLOUD_HAZARD') {
              romanticAudio.playMissSound();
              state.lives -= 1;
              state.combo = 1;
              setLives(state.lives);
              setCombo(1);
              spawn3DBurst(drawX, item.y, 0x94a3b8);
              setLastCatchBanner({
                id: state.nextItemId++,
                text: '⛈️ 3D Storm Cloud! -1 Heart',
                color: '#fda4af',
              });

              if (state.lives <= 0) {
                if (state.score > highScore) {
                  setHighScore(state.score);
                  try {
                    localStorage.setItem('amore_catcher_highscore', String(state.score));
                  } catch {}
                }
                addArcadePoints(state.score);
                setCatcherState('GAME_OVER');
                break;
              }
            } else {
              let basePts = 15;
              let label = '3D Sister Note';
              let pColor = 0xf43f5e;

              if (item.type === 'CUPCAKE') {
                basePts = 25;
                label = '3D Cupcake';
                pColor = 0xf59e0b;
              } else if (item.type === 'STAR') {
                basePts = 50;
                label = '3D Gold Star';
                pColor = 0xfde047;
              } else if (item.type === 'ROSE_HEAL') {
                basePts = 30;
                label = '+1 Heart Gem';
                pColor = 0x10b981;
                state.lives = Math.min(3, state.lives + 1);
                setLives(state.lives);
              }

              const earned = basePts * state.combo;
              state.score += earned;
              state.caughtCount += 1;

              if (state.caughtCount % 5 === 0) {
                state.combo = Math.min(5, state.combo + 1);
              }
              const nextWave = Math.floor(state.caughtCount / 10) + 1;
              if (nextWave > state.wave) {
                state.wave = nextWave;
                setWave(nextWave);
              }

              setScore(state.score);
              setCombo(state.combo);
              setCaughtCount(state.caughtCount);
              romanticAudio.playCatchChime(state.combo);
              spawn3DBurst(drawX, item.y, pColor);
              setLastCatchBanner({
                id: state.nextItemId++,
                text: `+${earned} pts · ${label} ${state.combo > 1 ? `(${state.combo}x)` : ''}`,
                color: '#fde047',
              });
            }
            continue;
          }

          if (item.y < -4.5) {
            scene.remove(item.meshGroup);
            active3DItems.splice(i, 1);
            if (item.type !== 'CLOUD_HAZARD' && item.type !== 'ROSE_HEAL' && state.combo > 1) {
              state.combo = 1;
              setCombo(1);
            }
          }
        }
      } else {
        // Gentle idle showcase rotation of the 3D basket when in menu/paused
        basketGroup.rotation.y += delta * 0.65;
      }

      // 4. Update 3D Burst Particles
      for (let i = active3DParticles.length - 1; i >= 0; i--) {
        const p = active3DParticles[i];
        p.mesh.position.x += p.vx * delta;
        p.mesh.position.y += p.vy * delta;
        p.mesh.position.z += p.vz * delta;
        p.mesh.rotation.x += 4 * delta;
        p.mesh.rotation.y += 4 * delta;
        p.life -= delta * 2.2;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          (p.mesh.material as THREE.Material).dispose();
          active3DParticles.splice(i, 1);
        } else {
          p.mesh.scale.setScalar(p.life);
        }
      }

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
      starBgGeo.dispose();
      starBgMat.dispose();
      envBoxGeo.dispose();
      sealGeo.dispose();
      cupBaseGeo.dispose();
      frostingGeo.dispose();
      cherryGeo.dispose();
      starOctGeo.dispose();
      starRingGeo.dispose();
      cloudSphereGeo.dispose();
      boltGeo.dispose();
      particleGeo.dispose();
      envMap.dispose();
      renderer.dispose();
    };
  }, [activeMode, catcherState, highScore, addArcadePoints]);

  const handle3DPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (catcherState !== 'PLAYING' || !mount3DRef.current) return;
    const rect = mount3DRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    gameRef.current.targetX = normX * 5.4;
  };

  // =========================================================
  // GAME 2: KEEPSAKE MEMORY MATCH (3D CARD TABLE BOARD GAME)
  // =========================================================
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [memoryBestMoves, setMemoryBestMoves] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem('amore_memory_best');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [isMemoryLocked, setIsMemoryLocked] = useState(false);

  const initMemoryGame = useCallback(() => {
    const deck: MemoryCard[] = [];
    MEMORY_PAIRS.forEach((pair) => {
      deck.push({ ...pair, uid: `${pair.pairId}-a`, isFlipped: false, isMatched: false });
      deck.push({ ...pair, uid: `${pair.pairId}-b`, isFlipped: false, isMatched: false });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setMemoryCards(deck);
    setFlippedIndices([]);
    setMemoryMoves(0);
    setMatchedCount(0);
    setIsMemoryLocked(false);
  }, []);

  useEffect(() => {
    initMemoryGame();
  }, [initMemoryGame]);

  const handleCardClick = (index: number) => {
    if (isMemoryLocked) return;
    const card = memoryCards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    romanticAudio.playSoftClick();
    const updated = memoryCards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
    setMemoryCards(updated);

    const nextFlipped = [...flippedIndices, index];
    setFlippedIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMoves = memoryMoves + 1;
      setMemoryMoves(nextMoves);
      setIsMemoryLocked(true);

      const [firstIdx, secondIdx] = nextFlipped;
      if (updated[firstIdx].pairId === updated[secondIdx].pairId) {
        setTimeout(() => {
          romanticAudio.playMatchSuccess();
          setMemoryCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isMatched: true } : c
            )
          );
          setFlippedIndices([]);
          setIsMemoryLocked(false);
          const nextMatched = matchedCount + 1;
          setMatchedCount(nextMatched);
          addArcadePoints(40);

          if (nextMatched === MEMORY_PAIRS.length) {
            romanticAudio.playCelebrationChime();
            confetti({ particleCount: 65, spread: 70, origin: { y: 0.7 } });
            if (memoryBestMoves === null || nextMoves < memoryBestMoves) {
              setMemoryBestMoves(nextMoves);
              try {
                localStorage.setItem('amore_memory_best', String(nextMoves));
              } catch {}
            }
          }
        }, 280);
      } else {
        setTimeout(() => {
          setMemoryCards((prev) =>
            prev.map((c, i) =>
              i === firstIdx || i === secondIdx ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedIndices([]);
          setIsMemoryLocked(false);
        }, 700);
      }
    }
  };

  // =========================================================
  // GAME 3: 3D WORD CIPHER (EXTRUDED KEYCAP PUZZLE)
  // =========================================================
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const currentPuzzle = WORD_PUZZLES[puzzleIndex % WORD_PUZZLES.length];
  const [scrambledPool, setScrambledPool] = useState<{ char: string; used: boolean }[]>([]);
  const [guessedIndices, setGuessedIndices] = useState<number[]>([]);
  const [hintTier, setHintTier] = useState(0);
  const [wordSolved, setWordSolved] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);

  const loadWordPuzzle = useCallback((idx: number) => {
    const target = WORD_PUZZLES[idx % WORD_PUZZLES.length].word;
    const chars = scrambleWord(target);
    setScrambledPool(chars.map((char) => ({ char, used: false })));
    setGuessedIndices([]);
    setHintTier(0);
    setWordSolved(false);
  }, []);

  useEffect(() => {
    loadWordPuzzle(puzzleIndex);
  }, [puzzleIndex, loadWordPuzzle]);

  const currentGuessString = guessedIndices.map((i) => scrambledPool[i]?.char || '').join('');

  const handleSelectTile = (poolIndex: number) => {
    if (wordSolved || scrambledPool[poolIndex]?.used) return;
    romanticAudio.playSoftClick();

    const nextPool = scrambledPool.map((item, idx) =>
      idx === poolIndex ? { ...item, used: true } : item
    );
    const nextGuessed = [...guessedIndices, poolIndex];
    setScrambledPool(nextPool);
    setGuessedIndices(nextGuessed);

    const candidate = nextGuessed.map((i) => nextPool[i].char).join('');
    if (candidate === currentPuzzle.word) {
      setWordSolved(true);
      setSolvedCount((c) => c + 1);
      addArcadePoints(75);
      romanticAudio.playMatchSuccess();
      confetti({ particleCount: 45, spread: 55, origin: { y: 0.75 } });
    } else if (candidate.length === currentPuzzle.word.length) {
      romanticAudio.playMissSound();
    }
  };

  const handleRemoveLastLetter = () => {
    if (wordSolved || guessedIndices.length === 0) return;
    romanticAudio.playSoftClick();
    const lastPoolIdx = guessedIndices[guessedIndices.length - 1];
    setScrambledPool((prev) =>
      prev.map((item, idx) => (idx === lastPoolIdx ? { ...item, used: false } : item))
    );
    setGuessedIndices((prev) => prev.slice(0, -1));
  };

  const handleClearGuess = () => {
    if (wordSolved) return;
    romanticAudio.playSoftClick();
    setScrambledPool((prev) => prev.map((item) => ({ ...item, used: false })));
    setGuessedIndices([]);
  };

  const handleUseHint = () => {
    if (wordSolved) return;
    romanticAudio.playSoftClick();
    const nextTier = Math.min(3, hintTier + 1);
    setHintTier(nextTier);

    const targetWord = currentPuzzle.word;
    let matchPrefixLen = 0;
    for (let i = 0; i < guessedIndices.length; i++) {
      if (scrambledPool[guessedIndices[i]]?.char === targetWord[i]) {
        matchPrefixLen++;
      } else {
        break;
      }
    }

    const revealLen = Math.min(targetWord.length - 1, matchPrefixLen + 1);
    const newPool = scrambledPool.map((item) => ({ ...item, used: false }));
    const newGuessed: number[] = [];

    for (let i = 0; i < revealLen; i++) {
      const neededChar = targetWord[i];
      const foundIdx = newPool.findIndex((item) => !item.used && item.char === neededChar);
      if (foundIdx !== -1) {
        newPool[foundIdx].used = true;
        newGuessed.push(foundIdx);
      }
    }

    setScrambledPool(newPool);
    setGuessedIndices(newGuessed);
  };

  const handleNextWord = () => {
    romanticAudio.playSoftClick();
    setPuzzleIndex((prev) => prev + 1);
  };

  const getLivesStatusText = () => {
    if (lives === 3) return '3/3 · FULL';
    if (lives === 2) return '2/3 · STEADY';
    if (lives === 1) return '1/3 · CRITICAL';
    return '0/3 · DEPLETED';
  };

  return (
    <section id="arcade" className="py-20 border-b border-stone-200/80 bg-[#f6f1eb]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-widest mb-2">
              <span>Interactive 3D Keepsake Arcade</span>
              <span aria-hidden="true">·</span>
              <span>3 Playable 3D Mini-Games</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-stone-900 text-balance heading-3d">
              The 3D Birthday Game Lounge for {girlfriendName}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-stone-600 max-w-2xl">
              Catch 3D birthday collectibles in a real-time Three.js WebGL arena, flip 3D keepsake cards, or press tactile 3D letter blocks to unlock a secret golden birthday voucher.
            </p>
          </div>

          {/* Total Arcade Score & Bonus Unlock Progress */}
          <div className="bg-white border border-stone-200/90 rounded-xl p-4 flex items-center gap-4 shadow-xs shrink-0 card-3d-tilt">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-medium">
                Total Arcade Score · <span className="font-mono tabular-nums font-semibold text-stone-900">{totalArcadePoints} pts</span>
              </div>
              {totalArcadePoints >= 300 ? (
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700">
                    ★ Golden Birthday Prize Ready!
                  </span>
                  {onUnlockBonusCoupon && !bonusUnlocked && (
                    <button
                      onClick={() => {
                        romanticAudio.playCelebrationChime();
                        confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
                        onUnlockBonusCoupon();
                      }}
                      className="px-2.5 py-1 text-xs font-medium bg-rose-700 text-white rounded-md hover:bg-rose-800 transition-colors cursor-pointer whitespace-nowrap btn-3d-rose"
                    >
                      Claim Bonus Voucher
                    </button>
                  )}
                  {bonusUnlocked && (
                    <span className="text-xs text-stone-500">Added to Vouchers</span>
                  )}
                </div>
              ) : (
                <div className="text-xs text-stone-500 mt-0.5 tabular-nums">
                  Earn <span className="font-semibold text-rose-700">{Math.max(0, 300 - totalArcadePoints)} more pts</span> to unlock a Secret Golden Voucher
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Game Selector Tabs (Segmented Controls) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="inline-flex items-center gap-1.5 p-1.5 bg-stone-200/80 rounded-xl">
            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setActiveMode('STARLIGHT_CATCHER');
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'STARLIGHT_CATCHER'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>01. 3D Starlight Wish Catcher</span>
            </button>

            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setActiveMode('MEMORY_MATCH');
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'MEMORY_MATCH'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>02. 3D Keepsake Memory Match</span>
            </button>

            <button
              onClick={() => {
                romanticAudio.playSoftClick();
                setActiveMode('WORD_CIPHER');
              }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                activeMode === 'WORD_CIPHER'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-700 hover:text-stone-950'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>03. 3D Sister Word Cipher</span>
            </button>
          </div>

          <div className="text-xs text-stone-500">
            <span>Controls: Mouse, Touch, or Keyboard</span>
            <span aria-hidden="true"> · </span>
            <span>Three.js WebGL 3D Engine</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODE 1: 3D STARLIGHT WISH CATCHER (THREE.JS WEBGL)        */}
        {/* ========================================================= */}
        {activeMode === 'STARLIGHT_CATCHER' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
            {/* Unobtrusive Top HUD Header */}
            <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-slate-200">
              <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400">Score: </span>
                  <span className="font-mono font-bold text-white tabular-nums text-base">
                    {score}
                  </span>
                </div>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <div>
                  <span className="text-slate-400">Combo: </span>
                  <span className="font-mono font-bold text-amber-400 tabular-nums">
                    {combo}x
                  </span>
                </div>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <div>
                  <span className="text-slate-400">Wave: </span>
                  <span className="font-mono font-semibold text-rose-300 tabular-nums">
                    {wave}
                  </span>
                </div>
                <span className="text-slate-700" aria-hidden="true">·</span>
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span className="font-mono text-xs font-semibold tabular-nums text-rose-200">
                    Hearts: {getLivesStatusText()}
                  </span>
                </div>
                {lastCatchBanner && catcherState === 'PLAYING' && (
                  <>
                    <span className="text-slate-700" aria-hidden="true">·</span>
                    <span
                      key={lastCatchBanner.id}
                      className="font-mono text-xs font-bold text-amber-300"
                    >
                      {lastCatchBanner.text}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400 font-mono tabular-nums">
                  Best: <span className="text-amber-300 font-semibold">{Math.max(highScore, score)}</span>
                </div>
                {catcherState === 'PLAYING' || catcherState === 'PAUSED' ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePauseCatcher}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {catcherState === 'PAUSED' ? (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={startCatcherGame}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restart</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Dedicated Three.js 3D WebGL Game Viewport Container */}
            <div
              onPointerMove={handle3DPointerMove}
              className="relative w-full aspect-[16/9] max-h-[500px] bg-[#090d1a] flex items-center justify-center select-none cursor-ew-resize touch-none"
            >
              <div ref={mount3DRef} className="w-full h-full" />

              {/* STATE: TITLE_MENU (no backdrop-blur over WebGL per Three.js skill) */}
              {catcherState === 'TITLE_MENU' && (
                <div className="absolute inset-0 bg-slate-950/92 flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-2">
                      Three.js 3D WebGL Arcade · 60 FPS
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-3 heading-3d-light">
                      3D Starlight Wish Catcher
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                      Glide your 3D keepsake basket with your mouse, finger, or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-xs">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-mono text-xs">→</kbd> arrow keys. Catch falling 3D Wax-Sealed Envelopes, 3D Cupcakes, and 3D Golden Star Crystals while dodging 3D Storm Clouds!
                    </p>

                    <div className="grid grid-cols-3 gap-3 text-left bg-slate-900 border border-slate-800 p-3.5 rounded-xl mb-6 text-xs">
                      <div>
                        <div className="font-semibold text-rose-300">💌 3D Envelope</div>
                        <div className="text-slate-400 tabular-nums">+15 pts · Combo</div>
                      </div>
                      <div>
                        <div className="font-semibold text-amber-300">🌟 3D Star Crystal</div>
                        <div className="text-slate-400 tabular-nums">+50 pts · Boost</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-300">⛈️ 3D Storm Cloud</div>
                        <div className="text-slate-400 tabular-nums">-1 Heart Hazard</div>
                      </div>
                    </div>

                    <button
                      onClick={startCatcherGame}
                      className="px-6 py-3 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap btn-3d-rose"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start 3D Game</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: PAUSED */}
              {catcherState === 'PAUSED' && (
                <div className="absolute inset-0 bg-slate-950/92 flex flex-col items-center justify-center p-6 text-center">
                  <h3 className="text-2xl font-serif font-bold text-white mb-2 heading-3d-light">
                    3D Game Paused
                  </h3>
                  <p className="text-sm text-slate-300 mb-6">
                    Current Score: <span className="font-mono font-bold text-amber-300">{score}</span> · Wave {wave}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePauseCatcher}
                      className="px-5 py-2.5 text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors cursor-pointer whitespace-nowrap btn-3d-rose"
                    >
                      Resume Game
                    </button>
                    <button
                      onClick={startCatcherGame}
                      className="px-5 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Restart
                    </button>
                  </div>
                </div>
              )}

              {/* STATE: GAME_OVER */}
              {catcherState === 'GAME_OVER' && (
                <div className="absolute inset-0 bg-slate-950/94 flex flex-col items-center justify-center p-6 text-center">
                  <div className="max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
                      <Award className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-1 heading-3d-light">
                      Wonderful Catching, {girlfriendName}!
                    </h3>
                    <p className="text-xs text-slate-400 mb-5">
                      Every 3D wish caught is another happy memory for your birthday year ahead.
                    </p>

                    <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 mb-6">
                      <div>
                        <div className="text-[11px] text-slate-400">Final Score</div>
                        <div className="text-lg font-mono font-bold text-white tabular-nums">{score}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Wishes Caught</div>
                        <div className="text-lg font-mono font-bold text-rose-400 tabular-nums">{caughtCount}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">High Score</div>
                        <div className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                          {Math.max(score, highScore)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={startCatcherGame}
                      className="w-full py-3 px-5 text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap btn-3d-rose"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Play Again</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 2: 3D KEEPSAKE MEMORY MATCH                          */}
        {/* ========================================================= */}
        {activeMode === 'MEMORY_MATCH' && (
          <div className="bg-[#1b3b2b] border-2 border-[#12291e] rounded-2xl p-6 sm:p-8 shadow-xl text-stone-100">
            {/* Top HUD Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-emerald-900/80">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white heading-3d-light">
                  3D Keepsake Memory Match Table
                </h3>
                <p className="text-xs sm:text-sm text-emerald-200/80 mt-0.5">
                  Flip two 3D cards at a time to pair all 8 sisterhood birthday keepsakes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-xs sm:text-sm">
                <div>
                  <span className="text-emerald-200/70">Pairs Found: </span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    {matchedCount} / {MEMORY_PAIRS.length}
                  </span>
                </div>
                <span className="text-emerald-800" aria-hidden="true">·</span>
                <div>
                  <span className="text-emerald-200/70">Moves: </span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    {memoryMoves}
                  </span>
                </div>
                {memoryBestMoves !== null && (
                  <>
                    <span className="text-emerald-800" aria-hidden="true">·</span>
                    <div>
                      <span className="text-emerald-200/70">Best: </span>
                      <span className="font-mono font-semibold text-emerald-300 tabular-nums">
                        {memoryBestMoves} moves
                      </span>
                    </div>
                  </>
                )}

                <button
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    initMemoryGame();
                  }}
                  className="px-3.5 py-2 text-xs font-medium bg-emerald-950/90 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset 3D Deck</span>
                </button>
              </div>
            </div>

            {/* 4x4 3D Perspective Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto perspective-1200">
              {memoryCards.map((card, idx) => {
                const revealed = card.isFlipped || card.isMatched;
                return (
                  <button
                    key={card.uid}
                    onClick={() => handleCardClick(idx)}
                    disabled={revealed}
                    aria-label={revealed ? card.title : `Hidden keepsake card ${idx + 1}`}
                    className="group relative h-28 sm:h-32 w-full cursor-pointer select-none perspective-1000 bg-transparent border-0 p-0"
                  >
                    <div
                      className={`relative w-full h-full rounded-xl transition-transform duration-500 preserve-3d ${
                        revealed ? 'rotate-y-180' : 'group-hover:-translate-y-1'
                      }`}
                    >
                      {/* Front Face (Unflipped Card Back) */}
                      <div
                        className="absolute inset-0 w-full h-full rounded-xl bg-emerald-950/90 border-2 border-emerald-700/70 text-emerald-200 flex flex-col items-center justify-center p-3 backface-hidden"
                        style={{
                          boxShadow: '0 6px 0 0 #0c1f17, 0 10px 18px -4px rgba(0,0,0,0.45)',
                        }}
                      >
                        <div className="w-9 h-9 rounded-full border border-emerald-500/50 bg-emerald-900/60 flex items-center justify-center text-amber-300 text-base mb-1.5 shadow-inner">
                          ★
                        </div>
                        <span className="text-[11px] font-serif tracking-wider uppercase text-emerald-200/80">
                          Big Sis 3D Deck
                        </span>
                      </div>

                      {/* Back Face (Revealed Keepsake Face rotated 180deg in 3D) */}
                      <div
                        className={`absolute inset-0 w-full h-full rounded-xl p-3 flex flex-col items-center justify-center text-center border-2 rotate-y-180 backface-hidden ${
                          card.isMatched
                            ? 'bg-amber-50 border-amber-300 text-stone-900'
                            : 'bg-white border-stone-200 text-stone-900'
                        }`}
                        style={{
                          boxShadow: card.isMatched
                            ? '0 5px 0 0 #d97706, 0 10px 16px -4px rgba(0,0,0,0.35)'
                            : '0 5px 0 0 #cbd5e1, 0 10px 16px -4px rgba(0,0,0,0.35)',
                        }}
                      >
                        <span className="text-2xl sm:text-3xl mb-1" role="img" aria-hidden="true">
                          {card.symbol}
                        </span>
                        <span className="font-serif font-bold text-xs sm:text-sm text-stone-900 leading-tight">
                          {card.title}
                        </span>
                        <span className="text-[11px] text-stone-500 mt-0.5">
                          {card.isMatched ? '✓ Matched' : card.subtitle}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Victory Banner when all 8 pairs matched */}
            {matchedCount === MEMORY_PAIRS.length && (
              <div className="mt-8 max-w-2xl mx-auto bg-white text-stone-900 rounded-xl p-5 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md card-3d-tilt">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">
                    All 8 Keepsake Pairs Matched!
                  </div>
                  <h4 className="text-lg font-serif font-bold text-stone-900 mt-0.5 heading-3d">
                    Completed in {memoryMoves} moves, {girlfriendName}!
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    “Every card on this table represents a favorite sibling memory with you.” — {boyfriendName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    romanticAudio.playSoftClick();
                    initMemoryGame();
                  }}
                  className="px-4 py-2.5 text-xs font-semibold bg-stone-900 text-white hover:bg-stone-800 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 btn-3d-dark"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* MODE 3: 3D SISTER WORD CIPHER                             */}
        {/* ========================================================= */}
        {activeMode === 'WORD_CIPHER' && (
          <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
            {/* Top Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-stone-200">
              <div>
                <div className="text-xs text-rose-800 font-semibold uppercase tracking-wider mb-1">
                  Puzzle {puzzleIndex + 1} of {WORD_PUZZLES.length} · {currentPuzzle.category}
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 heading-3d">
                  Unscramble the 3D Keepsake Word
                </h3>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm">
                <div className="text-stone-600">
                  Words Solved: <span className="font-mono font-bold text-stone-900 tabular-nums">{solvedCount}</span>
                </div>
                <button
                  onClick={handleUseHint}
                  disabled={wordSolved}
                  className="px-3.5 py-2 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap tile-3d-extruded"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reveal Letter Hint ({hintTier}/3)</span>
                </button>
              </div>
            </div>

            {/* Clue Card */}
            <div className="max-w-2xl mx-auto text-center mb-8">
              <p className="text-sm sm:text-base text-stone-700 font-serif italic bg-stone-50 border border-stone-200/80 rounded-xl p-4 card-3d-tilt">
                “{currentPuzzle.clue}”
              </p>
            </div>

            {/* Target Answer Slots (3D Recessed / Extruded Tiles) */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {currentPuzzle.word.split('').map((_, slotIdx) => {
                const chosenChar = currentGuessString[slotIdx] || '';
                const isFullAndWrong =
                  !wordSolved &&
                  currentGuessString.length === currentPuzzle.word.length &&
                  currentGuessString !== currentPuzzle.word;

                return (
                  <div
                    key={slotIdx}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-mono font-bold transition-all ${
                      wordSolved
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-[0_5px_0_0_#10b981] -translate-y-0.5'
                        : isFullAndWrong
                        ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-[0_4px_0_0_#fb7185]'
                        : chosenChar
                        ? 'bg-stone-900 border-stone-900 text-white shadow-[0_5px_0_0_#44403c] -translate-y-0.5'
                        : 'bg-stone-100 border-stone-300 text-stone-400 shadow-inner'
                    }`}
                  >
                    {chosenChar}
                  </div>
                );
              })}
            </div>

            {/* Scrambled 3D Keycap Letter Pool Buttons */}
            {!wordSolved ? (
              <div className="max-w-xl mx-auto">
                <div className="flex flex-wrap items-center justify-center gap-3 mb-7">
                  {scrambledPool.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectTile(idx)}
                      disabled={item.used}
                      className={`min-w-[48px] min-h-[48px] px-4 py-2.5 rounded-xl border font-mono text-lg font-bold cursor-pointer ${
                        item.used
                          ? 'bg-stone-100 border-stone-200 text-stone-300 opacity-40 cursor-not-allowed translate-y-0.5'
                          : 'bg-white hover:bg-rose-50 border-stone-300 hover:border-rose-300 text-stone-900 tile-3d-extruded'
                      }`}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleRemoveLastLetter}
                    disabled={guessedIndices.length === 0}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap tile-3d-extruded"
                  >
                    Backspace
                  </button>
                  <button
                    onClick={handleClearGuess}
                    disabled={guessedIndices.length === 0}
                    className="px-4 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap tile-3d-extruded"
                  >
                    Clear Letters
                  </button>
                  <button
                    onClick={handleNextWord}
                    className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Skip Word →
                  </button>
                </div>
              </div>
            ) : (
              /* Solved Celebration Box */
              <div className="max-w-xl mx-auto bg-emerald-50/90 border border-emerald-300 rounded-xl p-5 text-center card-3d-tilt">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cipher Unlocked · +75 Arcade Points</span>
                </div>
                <p className="font-serif text-base sm:text-lg text-stone-900 italic mt-1 mb-4">
                  “{currentPuzzle.sweetNote}”
                </p>
                <button
                  onClick={handleNextWord}
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap btn-3d-dark"
                >
                  Next Sister Cipher →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
