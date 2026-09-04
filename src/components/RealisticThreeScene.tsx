import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { AppliedMaterials, PlacedObject } from "../types";
import { findThreeAssetByCatalogName, objectParticipatesInCollision } from "../threeAssetManifest";
import { createSurfaceMaterial, disposeSurfaceMaterial } from "../threeMaterials";
import { getRotatedFootprint, resolveObjectPlacement } from "../spatialPlacement";

interface RealisticThreeSceneProps {
  roomDimensions: { width: number; depth: number; height: number };
  placedObjects: PlacedObject[];
  appliedMaterials: AppliedMaterials;
  mode?: "project" | "360";
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  onUpdateObject?: (id: string, updated: Partial<PlacedObject>) => void;
  lockedObjectIds?: string[];
}

interface AssetLoadProblem {
  id: string;
  name: string;
  reason: string;
}

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
  onUpdateObject,
  lockedObjectIds = [],
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [problems, setProblems] = useState<AssetLoadProblem[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [interactionNotice, setInteractionNotice] = useState<string | null>(null);

  const selectedObject = placedObjects.find((item) => item.id === selectedObjectId) || null;
  const selectedIsLocked = selectedObject ? lockedObjectIds.includes(selectedObject.id) : false;

  const applySelectedTransform = (requested: Partial<Pick<PlacedObject, "x" | "y" | "rotation">>) => {
    if (!selectedObject || selectedIsLocked || !onUpdateObject) return;
    const result = resolveObjectPlacement(
      selectedObject,
      requested,
      roomDimensions,
      placedObjects,
      (item) => objectParticipatesInCollision(item.name),
    );
    if (!result.valid) {
      setInteractionNotice(`Movimento bloqueado: colisão com ${result.conflictingObject?.name || "outro objeto"}.`);
      return;
    }
    onUpdateObject(selectedObject.id, result.update);
    setInteractionNotice("Posição sincronizada com a planta 2D e o salvamento do projeto.");
  };

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

    const floorMaterial = createSurfaceMaterial(appliedMaterials.floor, "#c9b9a5", "floor");
    const northMat = createSurfaceMaterial(appliedMaterials.wallNorth, "#eef2f5", "wall");
    const southMat = createSurfaceMaterial(appliedMaterials.wallSouth, "#eef2f5", "wall");
    const eastMat = createSurfaceMaterial(appliedMaterials.wallEast, "#eef2f5", "wall");
    const westMat = createSurfaceMaterial(appliedMaterials.wallWest, "#eef2f5", "wall");

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

    createWall(roomDimensions.width, roomDimensions.height, wallThickness, 0, roomDimensions.height / 2, -roomDimensions.depth / 2, northMat);
    createWall(roomDimensions.width, roomDimensions.height, wallThickness, 0, roomDimensions.height / 2, roomDimensions.depth / 2, southMat);
    createWall(wallThickness, roomDimensions.height, roomDimensions.depth, -roomDimensions.width / 2, roomDimensions.height / 2, 0, westMat);
    createWall(wallThickness, roomDimensions.height, roomDimensions.depth, roomDimensions.width / 2, roomDimensions.height / 2, 0, eastMat);

    const loader = new GLTFLoader();
    const disposableRoots: THREE.Object3D[] = [];
    const collisionBoxes = new Map<string, THREE.Box3>();
    const loadedObjects = new Map<string, { root: THREE.Object3D; item: PlacedObject }>();
    const selectionHelpers: THREE.BoxHelper[] = [];
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
      root.rotation.y = THREE.MathUtils.degToRad(-item.rotation);
      root.updateMatrixWorld(true);

      const fitted = new THREE.Box3().setFromObject(root);
      const fittedCenter = fitted.getCenter(new THREE.Vector3());
      const fittedMin = fitted.min;
      const footprint = getRotatedFootprint(item);
      const targetX = item.x + footprint.width / 2 - roomDimensions.width / 2;
      const targetZ = item.y + footprint.depth / 2 - roomDimensions.depth / 2;
      root.position.x += targetX - fittedCenter.x;
      root.position.z += targetZ - fittedCenter.z;
      root.position.y += -fittedMin.y;
      root.updateMatrixWorld(true);

      root.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
    };

    const placeLoadedRoot = (root: THREE.Object3D, item: PlacedObject) => {
      const current = new THREE.Box3().setFromObject(root);
      const center = current.getCenter(new THREE.Vector3());
      const footprint = getRotatedFootprint(item);
      const targetX = item.x + footprint.width / 2 - roomDimensions.width / 2;
      const targetZ = item.y + footprint.depth / 2 - roomDimensions.depth / 2;
      root.position.x += targetX - center.x;
      root.position.z += targetZ - center.z;
      root.updateMatrixWorld(true);
      const updatedBox = new THREE.Box3().setFromObject(root);
      collisionBoxes.set(item.id, updatedBox);
      selectionHelpers.forEach((helper) => {
        if (helper.userData.placedObjectId === item.id) helper.update();
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
            loadedObjects.set(item.id, { root: gltf.scene, item });
            collisionBoxes.set(item.id, new THREE.Box3().setFromObject(gltf.scene));
            if (item.id === selectedObjectId) {
              const helper = new THREE.BoxHelper(gltf.scene, 0x60a5fa);
              helper.userData.placedObjectId = item.id;
              const helperMaterial = helper.material as THREE.LineBasicMaterial;
              helperMaterial.transparent = true;
              helperMaterial.opacity = 0.65;
              scene.add(helper);
              selectionHelpers.push(helper);
            }
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
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const floorPoint = new THREE.Vector3();
    let dragState: {
      id: string;
      root: THREE.Object3D;
      item: PlacedObject;
      offsetX: number;
      offsetY: number;
      pending: Pick<PlacedObject, "x" | "y" | "rotation">;
    } | null = null;

    const updatePointerRay = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      updatePointerRay(event);
      const hit = raycaster.intersectObjects(scene.children, true).find((entry) => entry.object.userData?.placedObjectId);
      const id = hit?.object.userData?.placedObjectId as string | undefined;
      onSelectObject?.(id || null);
      mount.focus();

      if (!id || lockedObjectIds.includes(id) || !onUpdateObject) return;
      const loaded = loadedObjects.get(id);
      if (!loaded || !raycaster.ray.intersectPlane(floorPlane, floorPoint)) return;
      const planX = floorPoint.x + roomDimensions.width / 2;
      const planY = floorPoint.z + roomDimensions.depth / 2;
      dragState = {
        id,
        root: loaded.root,
        item: loaded.item,
        offsetX: planX - loaded.item.x,
        offsetY: planY - loaded.item.y,
        pending: { x: loaded.item.x, y: loaded.item.y, rotation: loaded.item.rotation },
      };
      controls.enabled = false;
      renderer.domElement.style.cursor = "grabbing";
      renderer.domElement.setPointerCapture(event.pointerId);
      event.preventDefault();
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragState) return;
      updatePointerRay(event);
      if (!raycaster.ray.intersectPlane(floorPlane, floorPoint)) return;
      const requestedX = floorPoint.x + roomDimensions.width / 2 - dragState.offsetX;
      const requestedY = floorPoint.z + roomDimensions.depth / 2 - dragState.offsetY;
      const result = resolveObjectPlacement(
        dragState.item,
        { x: requestedX, y: requestedY },
        roomDimensions,
        placedObjects,
        (item) => objectParticipatesInCollision(item.name),
      );
      if (!result.valid) {
        setInteractionNotice(`Movimento bloqueado: colisão com ${result.conflictingObject?.name || "outro objeto"}.`);
        return;
      }
      dragState.pending = result.update;
      placeLoadedRoot(dragState.root, { ...dragState.item, ...result.update });
      setInteractionNotice("Movendo com encaixe de 5 cm.");
      event.preventDefault();
    };

    const finishPointerDrag = (event: PointerEvent) => {
      if (!dragState) return;
      onUpdateObject?.(dragState.id, dragState.pending);
      setInteractionNotice("Posição sincronizada com a planta 2D e o salvamento do projeto.");
      dragState = null;
      controls.enabled = true;
      renderer.domElement.style.cursor = "grab";
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", finishPointerDrag);
    renderer.domElement.addEventListener("pointercancel", finishPointerDrag);

    const pressed = new Set<string>();
    const navigationKeys = new Set(["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"]);
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const selected = selectedObjectId ? placedObjects.find((item) => item.id === selectedObjectId) : null;
      const canTransform = selected && !lockedObjectIds.includes(selected.id) && onUpdateObject;
      const isObjectMove = event.shiftKey && navigationKeys.has(key) && key.startsWith("arrow");
      const isObjectRotate = key === "q" || key === "e";
      if (canTransform && (isObjectMove || isObjectRotate)) {
        event.preventDefault();
        const requested = isObjectRotate
          ? { rotation: selected.rotation + (key === "q" ? -15 : 15) }
          : {
              x: selected.x + (key === "arrowleft" ? -0.05 : key === "arrowright" ? 0.05 : 0),
              y: selected.y + (key === "arrowup" ? -0.05 : key === "arrowdown" ? 0.05 : 0),
            };
        const result = resolveObjectPlacement(
          selected,
          requested,
          roomDimensions,
          placedObjects,
          (item) => objectParticipatesInCollision(item.name),
        );
        if (result.valid) {
          onUpdateObject(selected.id, result.update);
          setInteractionNotice("Transformação aplicada e sincronizada no projeto.");
        } else {
          setInteractionNotice(`Transformação bloqueada: colisão com ${result.conflictingObject?.name || "outro objeto"}.`);
        }
        return;
      }
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
        const cameraRadius = 0.28;
        const blockedByObject = Array.from(collisionBoxes.entries()).some(([id, box]) =>
          objectParticipatesInCollision(loadedObjects.get(id)?.item.name || "") &&
          nextX >= box.min.x - cameraRadius && nextX <= box.max.x + cameraRadius &&
          nextZ >= box.min.z - cameraRadius && nextZ <= box.max.z + cameraRadius
        );
        if (!blockedByObject) {
          const applied = new THREE.Vector3(nextX - camera.position.x, 0, nextZ - camera.position.z);
          camera.position.add(applied);
          controls.target.add(applied);
        }
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
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", finishPointerDrag);
      renderer.domElement.removeEventListener("pointercancel", finishPointerDrag);
      mount.removeEventListener("keydown", handleKeyDown);
      mount.removeEventListener("keyup", handleKeyUp);
      controls.dispose();
      selectionHelpers.forEach((helper) => {
        helper.geometry.dispose();
        (helper.material as THREE.Material).dispose();
        scene.remove(helper);
      });
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
      disposeSurfaceMaterial(floorMaterial);
      disposeSurfaceMaterial(northMat); disposeSurfaceMaterial(southMat); disposeSurfaceMaterial(eastMat); disposeSurfaceMaterial(westMat);
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [roomDimensions.width, roomDimensions.depth, roomDimensions.height, placedObjects, appliedMaterials, mode, selectedObjectId, onSelectObject, onUpdateObject, lockedObjectIds]);

  return (
    <div
      ref={mountRef as any}
      className="relative w-full h-full min-h-[420px] bg-slate-900 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      aria-label="Ambiente tridimensional da Prática 360º. Clique e arraste móveis. Use W A S D para caminhar."
      tabIndex={0}
    >
      <div className="absolute left-3 bottom-3 z-10 max-w-md rounded-xl border border-white/15 bg-slate-950/85 backdrop-blur px-3 py-2 text-white shadow-xl pointer-events-auto">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-black">Renderer 3D real · FASE 1</p>
          <span className="text-[10px] text-emerald-300">{loadedCount} GLB carregado(s)</span>
        </div>
        <p className="mt-1 text-[9px] leading-relaxed text-slate-300">
          Arraste o móvel para reposicionar · W/A/S/D para caminhar · Shift + setas move 5 cm · Q/E gira 15°.
        </p>
        {selectedObject && (
          <div className="mt-2 border-t border-white/10 pt-2">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[10px] font-bold text-sky-200">{selectedObject.name}</p>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[8px] font-black uppercase ${selectedIsLocked ? "bg-amber-400/20 text-amber-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                {selectedIsLocked ? "Travado" : "Editável"}
              </span>
            </div>
            {!selectedIsLocked && (
              <div className="mt-2 grid grid-cols-6 gap-1" aria-label="Controles de posição do objeto selecionado">
                <button type="button" onClick={() => applySelectedTransform({ x: selectedObject.x - 0.05 })} className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20" aria-label="Mover objeto para a esquerda">←</button>
                <button type="button" onClick={() => applySelectedTransform({ y: selectedObject.y - 0.05 })} className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20" aria-label="Mover objeto para cima">↑</button>
                <button type="button" onClick={() => applySelectedTransform({ y: selectedObject.y + 0.05 })} className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20" aria-label="Mover objeto para baixo">↓</button>
                <button type="button" onClick={() => applySelectedTransform({ x: selectedObject.x + 0.05 })} className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20" aria-label="Mover objeto para a direita">→</button>
                <button type="button" onClick={() => applySelectedTransform({ rotation: selectedObject.rotation - 15 })} className="rounded bg-sky-400/15 px-2 py-1 text-[10px] font-bold text-sky-100 hover:bg-sky-400/25" aria-label="Girar objeto 15 graus para a esquerda">−15°</button>
                <button type="button" onClick={() => applySelectedTransform({ rotation: selectedObject.rotation + 15 })} className="rounded bg-sky-400/15 px-2 py-1 text-[10px] font-bold text-sky-100 hover:bg-sky-400/25" aria-label="Girar objeto 15 graus para a direita">+15°</button>
              </div>
            )}
          </div>
        )}
        {interactionNotice && <p className="mt-1.5 text-[9px] leading-relaxed text-violet-200" role="status">{interactionNotice}</p>}
        {problems.length > 0 && (
          <p className="mt-1 text-[9px] leading-relaxed text-amber-300">
            {problems.length} item(ns) sem asset 3D compatível. Eles foram mantidos fora da cena em vez de virar blocos genéricos.
          </p>
        )}
      </div>
    </div>
  );
};
