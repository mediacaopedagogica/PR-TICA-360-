import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AppliedMaterials, PlacedObject } from "../types";
import { findThreeAssetByCatalogName } from "../threeAssetManifest";

interface RealisticThreeSceneProps {
  roomDimensions: { width: number; depth: number; height: number };
  placedObjects: PlacedObject[];
  appliedMaterials: AppliedMaterials;
  mode?: "project" | "360";
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
}

interface AssetLoadProblem {
  id: string;
  name: string;
  reason: string;
}

const colorOf = (hex: string | undefined, fallback: string) => {
  try {
    return new THREE.Color(hex || fallback);
  } catch {
    return new THREE.Color(fallback);
  }
};

/**
 * FASE 1 — renderer WebGL/Three.js.
 * Substitui o falso 3D em canvas 2D somente na prova de conceito.
 * Assets sem GLB compatível NÃO viram cubos: são reportados como pendentes.
 */
export const RealisticThreeScene: React.FC<RealisticThreeSceneProps> = ({
  roomDimensions,
  placedObjects,
  appliedMaterials,
  mode = "project",
  selectedObjectId = null,
  onSelectObject,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [problems, setProblems] = useState<AssetLoadProblem[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#dbe7f2");

    const camera = new THREE.PerspectiveCamera(
      mode === "360" ? 68 : 58,
      Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight),
      0.05,
      150,
    );
    camera.position.set(0, Math.min(1.65, roomDimensions.height - 0.25), Math.max(2.2, roomDimensions.depth * 0.28));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(Math.max(1, mount.clientWidth), Math.max(1, mount.clientHeight));
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = true;
    controls.minDistance = 0.6;
    controls.maxDistance = Math.max(roomDimensions.width, roomDimensions.depth) * 1.8;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0.9, 0);

    const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x59636d, 1.6);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4df, 3.2);
    sun.position.set(-4.5, 6.5, 3.5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 30;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xbfdcff, 0.75);
    fill.position.set(4, 3, -3);
    scene.add(fill);

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: colorOf(appliedMaterials.floor?.color, "#c9b9a5"),
      roughness: 0.62,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const wallBase = new THREE.MeshStandardMaterial({
      color: colorOf(appliedMaterials.wallNorth?.color, "#f1f4f6"),
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    });

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomDimensions.width, roomDimensions.depth), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(roomDimensions.width, roomDimensions.depth),
      new THREE.MeshStandardMaterial({ color: 0xf7f8fa, roughness: 0.95, side: THREE.DoubleSide }),
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomDimensions.height;
    scene.add(ceiling);

    const wallThickness = 0.06;
    const createWall = (w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    };

    const northMat = wallBase.clone(); northMat.color = colorOf(appliedMaterials.wallNorth?.color, "#eef2f5");
    const southMat = wallBase.clone(); southMat.color = colorOf(appliedMaterials.wallSouth?.color, "#eef2f5");
    const eastMat = wallBase.clone(); eastMat.color = colorOf(appliedMaterials.wallEast?.color, "#eef2f5");
    const westMat = wallBase.clone(); westMat.color = colorOf(appliedMaterials.wallWest?.color, "#eef2f5");
    createWall(roomDimensions.width, roomDimensions.height, wallThickness, 0, roomDimensions.height / 2, -roomDimensions.depth / 2, northMat);
    createWall(roomDimensions.width, roomDimensions.height, wallThickness, 0, roomDimensions.height / 2, roomDimensions.depth / 2, southMat);
    createWall(wallThickness, roomDimensions.height, roomDimensions.depth, -roomDimensions.width / 2, roomDimensions.height / 2, 0, westMat);
    createWall(wallThickness, roomDimensions.height, roomDimensions.depth, roomDimensions.width / 2, roomDimensions.height / 2, 0, eastMat);

    const loader = new GLTFLoader();
    const disposableRoots: THREE.Object3D[] = [];
    const loadProblems: AssetLoadProblem[] = [];
    let loaded = 0;
    let cancelled = false;

    const fitAndPlace = (root: THREE.Object3D, item: PlacedObject) => {
      root.updateMatrixWorld(true);
      const initial = new THREE.Box3().setFromObject(root);
      const size = initial.getSize(new THREE.Vector3());
      if (size.x <= 0 || size.y <= 0 || size.z <= 0) throw new Error("bounding box inválida");

      const sx = item.width / size.x;
      const sy = item.height / size.y;
      const sz = item.depth / size.z;
      root.scale.set(sx, sy, sz);
      root.updateMatrixWorld(true);

      const fitted = new THREE.Box3().setFromObject(root);
      const fittedCenter = fitted.getCenter(new THREE.Vector3());
      const fittedMin = fitted.min;

      const targetX = item.x + item.width / 2 - roomDimensions.width / 2;
      const targetZ = item.y + item.depth / 2 - roomDimensions.depth / 2;
      root.position.x += targetX - fittedCenter.x;
      root.position.z += targetZ - fittedCenter.z;
      root.position.y += -fittedMin.y;
      root.rotation.y = THREE.MathUtils.degToRad(-item.rotation);

      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    };

    placedObjects.forEach((item) => {
      const asset = findThreeAssetByCatalogName(item.name);
      if (!asset) {
        loadProblems.push({ id: item.id, name: item.name, reason: "ASSET 3D AUSENTE — não substituído por cubo." });
        return;
      }
      loader.load(
        asset.url,
        (gltf) => {
          if (cancelled) return;
          try {
            fitAndPlace(gltf.scene, item);
            gltf.scene.userData.placedObjectId = item.id;
            gltf.scene.traverse((child) => { child.userData.placedObjectId = item.id; });
            scene.add(gltf.scene);
            disposableRoots.push(gltf.scene);
            loaded += 1;
            setLoadedCount(loaded);
          } catch (error) {
            loadProblems.push({ id: item.id, name: item.name, reason: `Falha ao dimensionar asset: ${String(error)}` });
            setProblems([...loadProblems]);
          }
        },
        undefined,
        (error) => {
          if (cancelled) return;
          loadProblems.push({ id: item.id, name: item.name, reason: `Falha ao carregar GLB: ${String(error)}` });
          setProblems([...loadProblems]);
        },
      );
    });
    setProblems([...loadProblems]);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointerSelect = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(scene.children, true).find((entry) => entry.object.userData?.placedObjectId);
      onSelectObject?.(hit?.object.userData?.placedObjectId || null);
      mount.focus();
    };
    renderer.domElement.addEventListener("pointerup", handlePointerSelect);

    const pressed = new Set<string>();
    const navigationKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!navigationKeys.has(key)) return;
      event.preventDefault();
      pressed.add(key);
    };
    const handleKeyUp = (event: KeyboardEvent) => pressed.delete(event.key.toLowerCase());
    mount.addEventListener("keydown", handleKeyDown);
    mount.addEventListener("keyup", handleKeyUp);

    const grid = new THREE.GridHelper(
      Math.max(roomDimensions.width, roomDimensions.depth),
      Math.max(4, Math.round(Math.max(roomDimensions.width, roomDimensions.depth) * 2)),
      0x6f8090,
      0xaeb8c2,
    );
    grid.position.y = 0.003;
    (grid.material as THREE.Material).opacity = mode === "project" ? 0.16 : 0;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const clock = new THREE.Clock();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);
      const speed = 2.2 * delta;
      const move = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      right.crossVectors(forward, camera.up).normalize();
      if (pressed.has("w") || pressed.has("arrowup")) move.add(forward);
      if (pressed.has("s") || pressed.has("arrowdown")) move.sub(forward);
      if (pressed.has("d") || pressed.has("arrowright")) move.add(right);
      if (pressed.has("a") || pressed.has("arrowleft")) move.sub(right);
      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(speed);
        const margin = 0.35;
        const nextX = THREE.MathUtils.clamp(camera.position.x + move.x, -roomDimensions.width / 2 + margin, roomDimensions.width / 2 - margin);
        const nextZ = THREE.MathUtils.clamp(camera.position.z + move.z, -roomDimensions.depth / 2 + margin, roomDimensions.depth / 2 - margin);
        const applied = new THREE.Vector3(nextX - camera.position.x, 0, nextZ - camera.position.z);
        camera.position.add(applied);
        controls.target.add(applied);
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      if (!mount) return;
      const w = Math.max(1, mount.clientWidth);
      const h = Math.max(1, mount.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerup", handlePointerSelect);
      mount.removeEventListener("keydown", handleKeyDown);
      mount.removeEventListener("keyup", handleKeyUp);
      controls.dispose();
      disposableRoots.forEach((root) => {
        root.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => material?.dispose());
        });
      });
      floor.geometry.dispose();
      floorMaterial.dispose();
      northMat.dispose(); southMat.dispose(); eastMat.dispose(); westMat.dispose(); wallBase.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [roomDimensions.width, roomDimensions.depth, roomDimensions.height, placedObjects, appliedMaterials, mode, onSelectObject]);

  return (
    <div
      ref={mountRef as any}
      className="relative w-full h-full min-h-[420px] bg-slate-900 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      aria-label="Ambiente tridimensional da Prática 360º. Use W A S D ou setas após clicar na cena."
      tabIndex={0}
    >
      <div className="absolute left-3 bottom-3 z-10 max-w-sm rounded-xl border border-white/15 bg-slate-950/80 backdrop-blur px-3 py-2 text-white shadow-xl pointer-events-none">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-black">Renderer 3D real · FASE 1</p>
          <span className="text-[10px] text-emerald-300">{loadedCount} GLB carregado(s)</span>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-300">
          Clique em um objeto para selecioná-lo · W/A/S/D ou setas para caminhar · arraste para orbitar · roda para aproximar.
        </p>
        {selectedObjectId && <p className="mt-1 text-[9px] text-sky-200">Objeto selecionado no projeto: {selectedObjectId}</p>}
        {problems.length > 0 && (
          <p className="mt-1 text-[9px] leading-relaxed text-amber-300">
            {problems.length} item(ns) sem asset 3D compatível. Eles foram mantidos fora da cena em vez de virar blocos genéricos.
          </p>
        )}
      </div>
    </div>
  );
};
