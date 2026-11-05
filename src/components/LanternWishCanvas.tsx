import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Send, Sparkles, Eye } from 'lucide-react';
import { romanticAudio } from '../utils/audioSynth';

interface Lantern3DData {
  group: THREE.Group;
  vx: number;
  vy: number;
  vz: number;
  swayPhase: number;
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

export const LanternWishCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [wishInput, setWishInput] = useState('');
  const [releasedWishes, setReleasedWishes] = useState<string[]>([
    'Happy 28th May, Atrayee!',
    'Best older sister in the universe',
    'Endless joy, health & success',
  ]);

  const spawnLanternRef = useRef<((wishText: string) => void) | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = container.clientWidth || 800;
    const height = 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d1a');
    scene.fog = new THREE.FogExp2('#090d1a', 0.032);

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

    // Warm/Cool Lighting
    const hemiLight = new THREE.HemisphereLight(0x312e81, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const warmKey = new THREE.DirectionalLight(0xfbbf24, 1.2);
    warmKey.position.set(6, 10, 8);
    scene.add(warmKey);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.autoRotate = !isSoftwareGl;
    controls.autoRotateSpeed = 0.35;

    // 1. InstancedMesh 3D Starfield (150 stars)
    const starCount = 150;
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

    // Shared geometries & materials for Composite 3D Paper Lanterns (5 distinct parts per lantern)
    const lanternShellGeo = new THREE.CylinderGeometry(0.48, 0.34, 1.15, 16);
    const topCapGeo = new THREE.ConeGeometry(0.5, 0.22, 16);
    const bottomRingGeo = new THREE.TorusGeometry(0.34, 0.03, 10, 24);
    const coreFlameGeo = new THREE.SphereGeometry(0.14, 12, 12);
    const tasselGeo = new THREE.CylinderGeometry(0.02, 0.05, 0.45, 8);

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

    const createCompositeLantern = (x: number, y: number, z: number, hueOffset: number = 0) => {
      const group = new THREE.Group();
      group.position.set(x, y, z);

      // Part 1: Translucent glowing paper lantern body
      const paperMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.08 + hueOffset, 0.95, 0.58),
        emissive: new THREE.Color().setHSL(0.07 + hueOffset, 0.95, 0.45),
        emissiveIntensity: 1.35,
        roughness: 0.45,
        metalness: 0.05,
      });
      const body = new THREE.Mesh(lanternShellGeo, paperMat);
      group.add(body);

      // Part 2: Top bamboo & gold cap
      const topCap = new THREE.Mesh(topCapGeo, bambooMat);
      topCap.position.y = 0.66;
      group.add(topCap);

      // Part 3: Bottom bamboo rim
      const bottomRim = new THREE.Mesh(bottomRingGeo, bambooMat);
      bottomRim.rotation.x = Math.PI / 2;
      bottomRim.position.y = -0.57;
      group.add(bottomRim);

      // Part 4: Inner glowing flame core
      const core = new THREE.Mesh(coreFlameGeo, coreFlameMat);
      core.position.y = -0.2;
      group.add(core);

      // Part 5: Hanging golden wish tassel + 3D Floating Wish Scroll Tag
      const tassel = new THREE.Mesh(tasselGeo, goldWireMat);
      tassel.position.y = -0.82;
      group.add(tassel);

      const wishTag = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.42, 0.025),
        paperMat
      );
      wishTag.position.y = -1.12;
      group.add(wishTag);

      scene.add(group);
      lanterns.push({
        group,
        vx: (Math.random() - 0.5) * 0.25,
        vy: 0.45 + Math.random() * 0.35,
        vz: (Math.random() - 0.5) * 0.15,
        swayPhase: Math.random() * Math.PI * 2,
      });
    };

    // Populate initial 3D lanterns
    for (let i = 0; i < 9; i++) {
      createCompositeLantern(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (i % 3) * 0.02
      );
    }

    spawnLanternRef.current = () => {
      createCompositeLantern(
        (Math.random() - 0.5) * 4,
        -4.2,
        1 + (Math.random() - 0.5) * 2,
        Math.random() * 0.04
      );
    };

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
        l.group.position.x += Math.sin(elapsed * 1.2 + l.swayPhase) * 0.35 * delta + l.vx * delta;
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
      controls.dispose();
      starGeo.dispose();
      starMat.dispose();
      lanternShellGeo.dispose();
      topCapGeo.dispose();
      bottomRingGeo.dispose();
      coreFlameGeo.dispose();
      tasselGeo.dispose();
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

  return (
    <section className="py-20 border-b border-stone-200/80 bg-stone-900 text-white">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-widest mb-2">
            <span>Chapter 07</span>
            <span aria-hidden="true">·</span>
            <span>Interactive 3D Sky of Wishes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight text-white heading-3d-light">
            Release a 3D Birthday Lantern
          </h2>
          <p className="mt-2 text-sm text-stone-300 font-sans">
            Drag to orbit the 3D starry sky or type a birthday wish for Atrayee to launch a glowing 3D lantern.
          </p>
        </div>

        {/* Interactive 3D Sky Container */}
        <div className="relative rounded-2xl overflow-hidden border border-stone-800 shadow-2xl bg-[#090d1a]">
          <div
            ref={mountRef}
            onClick={() => {
              if (spawnLanternRef.current) {
                spawnLanternRef.current('✨');
                romanticAudio.playSoftClick();
              }
            }}
            className="w-full h-[420px] cursor-grab active:cursor-grabbing"
          />

          <div className="absolute top-3 left-4 text-[11px] text-stone-300 font-sans pointer-events-none flex items-center gap-1.5 bg-stone-950/80 px-3 py-1 rounded-md border border-stone-800">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>3D WebGL Scene · Drag to Orbit · Click to Launch Lantern</span>
          </div>

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
