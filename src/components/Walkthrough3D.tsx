import React, { useState, useRef, useEffect } from "react";
import { PlacedObject, Material, CourseType, Wall } from "../types";
import { PRESET_MATERIALS } from "../data";
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sun, Moon, 
  DoorOpen, RefreshCw, Palette, HelpCircle, Move, Lightbulb
} from "lucide-react";

interface Walkthrough3DProps {
  roomDimensions: { width: number; depth: number; height: number };
  placedObjects: PlacedObject[];
  appliedMaterials: { floor: Material | null; wallNorth: Material | null; wallSouth: Material | null; wallEast: Material | null; wallWest: Material | null };
  onUpdateMaterials: (surface: "floor" | "wallNorth" | "wallSouth" | "wallEast" | "wallWest", mat: Material | null) => void;
  onUpdateObject: (id: string, updated: Partial<PlacedObject>) => void;
  walls: Wall[];
}

export const Walkthrough3D: React.FC<Walkthrough3DProps> = ({
  roomDimensions,
  placedObjects,
  appliedMaterials,
  onUpdateMaterials,
  onUpdateObject,
  walls,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera State (in meters and radians)
  const [camX, setCamX] = useState(roomDimensions.width / 2);
  const [camY, setCamY] = useState(roomDimensions.depth * 0.85);
  const [camAngle, setCamAngle] = useState(-Math.PI / 2); // looking North (-Y direction)
  const [lightsOn, setLightsOn] = useState(true);
  const [activeSurfaceToPaint, setActiveSurfaceToPaint] = useState<"floor" | "wallNorth" | "wallSouth" | "wallEast" | "wallWest">("floor");
  const [selectedPaintMaterialId, setSelectedPaintMaterialId] = useState(PRESET_MATERIALS[0].id);

  const eyeHeight = 1.6; // average human eye height in meters

  // Movement speed
  const moveSpeed = 0.25; // meters per step
  const turnSpeed = 0.15; // radians per turn

  // Handle Walking & Rotating
  const walk = (direction: number) => {
    // direction: 1 for forward, -1 for backward
    let newX = camX + Math.cos(camAngle) * moveSpeed * direction;
    let newY = camY + Math.sin(camAngle) * moveSpeed * direction;

    // Boundary constraints (stay within room, buffer of 0.3m from walls)
    const margin = 0.3;
    if (newX < margin) newX = margin;
    if (newX > roomDimensions.width - margin) newX = roomDimensions.width - margin;
    if (newY < margin) newY = margin;
    if (newY > roomDimensions.depth - margin) newY = roomDimensions.depth - margin;

    setCamX(newX);
    setCamY(newY);
  };

  const turn = (direction: number) => {
    // direction: -1 for left, 1 for right
    setCamAngle((prev) => prev + turnSpeed * direction);
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "w" || e.key === "ArrowUp") walk(1);
      if (key === "s" || e.key === "ArrowDown") walk(-1);
      if (key === "a" || e.key === "ArrowLeft") turn(-1);
      if (key === "d" || e.key === "ArrowRight") turn(1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [camX, camY, camAngle, roomDimensions]);

  // Apply materials directly in Walkthrough
  const handleApplyMaterial = () => {
    const mat = PRESET_MATERIALS.find((m) => m.id === selectedPaintMaterialId) || null;
    onUpdateMaterials(activeSurfaceToPaint, mat);
  };

  // Toggle dynamic door state (Módulo 7 feature: "abrir portas")
  const handleToggleDoors = () => {
    const doors = placedObjects.filter(o => o.name.toLowerCase().includes("porta") || o.isOpen !== undefined);
    doors.forEach(door => {
      onUpdateObject(door.id, { isOpen: !door.isOpen });
    });
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear Canvas
    ctx.fillStyle = lightsOn ? "#cbd5e1" : "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // 3D Perspective Projection Function
    // Maps a 3D point (x, y, z) in meters relative to room space to screen space
    const project = (x: number, y: number, z: number) => {
      // Translate relative to camera
      const dx = x - camX;
      const dy = y - camY;

      // Rotate around camera angle (camAngle)
      // We align camera facing vector to the screen's positive vertical axis
      const rx = dx * Math.sin(-camAngle) - dy * Math.cos(-camAngle);
      const ry = dx * Math.cos(-camAngle) + dy * Math.sin(-camAngle);
      const rz = z - eyeHeight;

      // Projection plane
      if (ry <= 0.1) return null; // Behind camera clipping

      const fov = 1.0; // focal length ratio
      const sx = (rx / ry) * fov * (W / 2) + W / 2;
      const sy = (-rz / ry) * fov * (H / 2) + H / 2;

      return { x: sx, y: sy, depth: ry };
    };

    // 1. Draw Floor and Ceiling Polygons
    // We compute the 4 corners of the room at Z = 0 (floor) and Z = roomHeight (ceiling)
    const floorCorners = [
      project(0, 0, 0),
      project(roomDimensions.width, 0, 0),
      project(roomDimensions.width, roomDimensions.depth, 0),
      project(0, roomDimensions.depth, 0),
    ];

    const ceilingCorners = [
      project(0, 0, roomDimensions.height),
      project(roomDimensions.width, 0, roomDimensions.height),
      project(roomDimensions.width, roomDimensions.depth, roomDimensions.height),
      project(0, roomDimensions.depth, roomDimensions.height),
    ];

    // Helper to draw a projected 4-point polygon
    const drawPolygon = (pts: (any | null)[], color: string, border = false) => {
      if (pts.some(p => p === null)) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      if (border) {
        ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    // Draw Floor
    const floorColor = appliedMaterials.floor ? appliedMaterials.floor.color : "#d1d5db";
    drawPolygon(floorCorners, floorColor, true);

    // Draw Ceiling
    const ceilingColor = lightsOn ? "#f8fafc" : "#1e293b";
    drawPolygon(ceilingCorners, ceilingColor, true);

    // Draw Walls (North, South, East, West)
    const wNorth = appliedMaterials.wallNorth ? appliedMaterials.wallNorth.color : "#e2e8f0";
    const wSouth = appliedMaterials.wallSouth ? appliedMaterials.wallSouth.color : "#e2e8f0";
    const wEast = appliedMaterials.wallEast ? appliedMaterials.wallEast.color : "#e2e8f0";
    const wWest = appliedMaterials.wallWest ? appliedMaterials.wallWest.color : "#e2e8f0";

    // North Wall (y = 0)
    if (floorCorners[0] && floorCorners[1] && ceilingCorners[1] && ceilingCorners[0]) {
      drawPolygon([floorCorners[0], floorCorners[1], ceilingCorners[1], ceilingCorners[0]], wNorth, true);
    }
    // East Wall (x = width)
    if (floorCorners[1] && floorCorners[2] && ceilingCorners[2] && ceilingCorners[1]) {
      drawPolygon([floorCorners[1], floorCorners[2], ceilingCorners[2], ceilingCorners[1]], wEast, true);
    }
    // South Wall (y = depth)
    if (floorCorners[2] && floorCorners[3] && ceilingCorners[3] && ceilingCorners[2]) {
      drawPolygon([floorCorners[2], floorCorners[3], ceilingCorners[3], ceilingCorners[2]], wSouth, true);
    }
    // West Wall (x = 0)
    if (floorCorners[3] && floorCorners[0] && ceilingCorners[0] && ceilingCorners[3]) {
      drawPolygon([floorCorners[3], floorCorners[0], ceilingCorners[0], ceilingCorners[3]], wWest, true);
    }

    // 2. Combined 3D Wall and Furniture Rendering
    // We sort both custom walls and placed furniture items by distance to camera
    // to perform proper depth sorting (painter's algorithm)
    const renderItems: { type: "object" | "wall"; dist: number; data: any }[] = [];

    // Add objects to render queue
    placedObjects.forEach((obj) => {
      const dist = Math.hypot(obj.x + obj.width / 2 - camX, obj.y + obj.depth / 2 - camY);
      renderItems.push({ type: "object", dist, data: obj });
    });

    // Add walls to render queue
    walls.forEach((wall) => {
      const midX = (wall.x1 + wall.x2) / 2;
      const midY = (wall.y1 + wall.y2) / 2;
      const dist = Math.hypot(midX - camX, midY - camY);
      renderItems.push({ type: "wall", dist, data: wall });
    });

    // Sort render queue furthest first
    renderItems.sort((a, b) => b.dist - a.dist);

    renderItems.forEach((item) => {
      if (item.type === "object") {
        const obj = item.data;
        // 3D corners of the bounding block of the item
        const x0 = obj.x;
        const x1 = obj.x + obj.width;
        const y0 = obj.y;
        const y1 = obj.y + obj.depth;
        const z0 = 0;
        const z1 = obj.height;

        const pts = [
          project(x0, y0, z0), // 0: bottom-front-left
          project(x1, y0, z0), // 1: bottom-front-right
          project(x1, y1, z0), // 2: bottom-back-right
          project(x0, y1, z0), // 3: bottom-back-left
          project(x0, y0, z1), // 4: top-front-left
          project(x1, y0, z1), // 5: top-front-right
          project(x1, y1, z1), // 6: top-back-right
          project(x0, y1, z1), // 7: top-back-left
        ];

        if (pts.some(p => p === null)) return; // Clip if any corner is completely behind camera

        // Color coding blocks based on category
        let blockColor = "#10b981"; // green for residential
        if (obj.category === "Equipamentos") blockColor = "#6366f1"; // indigo
        else if (obj.category === "Clínicas") blockColor = "#ec4899"; // pink
        else if (obj.category === "Comercial") blockColor = "#f59e0b"; // yellow

        // Shadows & shading based on light state
        if (!lightsOn) {
          blockColor = "#1e293b";
        }

        // Draw sides of the 3D box (Bottom, Top, Front, Back, Left, Right)
        drawPolygon([pts[0], pts[1], pts[2], pts[3]], blockColor, true);
        drawPolygon([pts[4], pts[5], pts[6], pts[7]], lightsOn ? "#f1f5f9" : "#334155", true);
        drawPolygon([pts[0], pts[1], pts[5], pts[4]], blockColor, true);
        drawPolygon([pts[2], pts[3], pts[7], pts[6]], blockColor, true);
        drawPolygon([pts[0], pts[3], pts[7], pts[4]], blockColor, true);
        drawPolygon([pts[1], pts[2], pts[6], pts[5]], blockColor, true);

        // Draw labels above the objects
        const centerProj = project(obj.x + obj.width / 2, obj.y + obj.depth / 2, obj.height + 0.1);
        if (centerProj) {
          ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
          ctx.beginPath();
          ctx.roundRect(centerProj.x - 50, centerProj.y - 12, 100, 20, 4);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.fillText(obj.name.length > 18 ? `${obj.name.substr(0, 16)}...` : obj.name, centerProj.x, centerProj.y);
        }
      } else if (item.type === "wall") {
        const wall = item.data;
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const length = Math.hypot(dx, dy);
        if (length < 0.05) return;

        const ux = dx / length;
        const uy = dy / length;
        const nx = -uy;
        const ny = ux;
        const hThick = wall.thickness / 2;

        const x1_left = wall.x1 + nx * hThick;
        const y1_left = wall.y1 + ny * hThick;
        const x1_right = wall.x1 - nx * hThick;
        const y1_right = wall.y1 - ny * hThick;

        const x2_left = wall.x2 + nx * hThick;
        const y2_left = wall.y2 + ny * hThick;
        const x2_right = wall.x2 - nx * hThick;
        const y2_right = wall.y2 - ny * hThick;

        const h = wall.height || roomDimensions.height;

        const wallPts = [
          project(x1_left, y1_left, 0),    // 0: bottom-left-start
          project(x1_right, y1_right, 0),  // 1: bottom-right-start
          project(x2_right, y2_right, 0),  // 2: bottom-right-end
          project(x2_left, y2_left, 0),    // 3: bottom-left-end
          project(x1_left, y1_left, h),    // 4: top-left-start
          project(x1_right, y1_right, h),  // 5: top-right-start
          project(x2_right, y2_right, h),  // 6: top-right-end
          project(x2_left, y2_left, h),    // 7: top-left-end
        ];

        // Skip drawing if all corners are clipped behind the camera
        if (wallPts.every(p => p === null)) return;

        const topColor = lightsOn ? "#475569" : "#1e293b";
        const sideColor = lightsOn ? "#64748b" : "#334155";
        const faceColor = lightsOn ? "#475569" : "#1e293b";

        // Draw solid wall faces
        if (wallPts[0] && wallPts[1] && wallPts[2] && wallPts[3]) {
          drawPolygon([wallPts[0], wallPts[1], wallPts[2], wallPts[3]], sideColor, true);
        }
        if (wallPts[4] && wallPts[5] && wallPts[6] && wallPts[7]) {
          drawPolygon([wallPts[4], wallPts[5], wallPts[6], wallPts[7]], topColor, true);
        }
        if (wallPts[0] && wallPts[1] && wallPts[5] && wallPts[4]) {
          drawPolygon([wallPts[0], wallPts[1], wallPts[5], wallPts[4]], faceColor, true);
        }
        if (wallPts[2] && wallPts[3] && wallPts[7] && wallPts[6]) {
          drawPolygon([wallPts[2], wallPts[3], wallPts[7], wallPts[6]], faceColor, true);
        }
        if (wallPts[0] && wallPts[3] && wallPts[7] && wallPts[4]) {
          drawPolygon([wallPts[0], wallPts[3], wallPts[7], wallPts[4]], sideColor, true);
        }
        if (wallPts[1] && wallPts[2] && wallPts[6] && wallPts[5]) {
          drawPolygon([wallPts[1], wallPts[2], wallPts[6], wallPts[5]], sideColor, true);
        }
      }
    });

    // 3. Ambient Lighting Effects (Sun Ray / Shadows)
    if (lightsOn) {
      // Morning golden overlay
      const gradient = ctx.createRadialGradient(W / 2, H / 3, 20, W / 2, H / 2, W);
      gradient.addColorStop(0, "rgba(253, 224, 71, 0.15)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    } else {
      // Warm light sources rendering glow
      placedObjects.forEach(obj => {
        if (obj.lightSource && obj.isLit) {
          const lightProj = project(obj.x + obj.width / 2, obj.y + obj.depth / 2, obj.height);
          if (lightProj) {
            const glow = ctx.createRadialGradient(lightProj.x, lightProj.y, 10, lightProj.x, lightProj.y, 150);
            glow.addColorStop(0, "rgba(251, 191, 36, 0.5)");
            glow.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(lightProj.x, lightProj.y, 150, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Night dark vignetting
      ctx.fillStyle = "rgba(15, 23, 42, 0.4)";
      ctx.fillRect(0, 0, W, H);
    }

    // Compass & Position overlay inside canvas
    ctx.fillStyle = "rgba(15, 23, 42, 0.8)";
    ctx.beginPath();
    ctx.roundRect(15, 15, 130, 48, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Cam: (${camX.toFixed(1)}m, ${camY.toFixed(1)}m)`, 24, 30);
    ctx.fillText(`Direção: ${(camAngle * (180 / Math.PI)).toFixed(0)}°`, 24, 42);
    ctx.fillText(`Pé Direito: ${roomDimensions.height}m`, 24, 54);

  }, [camX, camY, camAngle, roomDimensions, placedObjects, appliedMaterials, lightsOn]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Immersion controls and walkpad */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-5">
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
            Módulo 7
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1 font-sans">Walkthrough & Render 360°</h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            Entre e caminhe por dentro do seu projeto BIM em tempo real. Use as setas do teclado (WASD) ou os botões de controle abaixo para navegar.
          </p>
        </div>

        {/* Dynamic Interactive Panel */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            < Sun className="h-4 w-4 text-emerald-600" />
            <span>Simulação Ambiental</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setLightsOn(!lightsOn)}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-all ${
                lightsOn
                  ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {lightsOn ? <Sun className="h-4 w-4 text-amber-500 animate-spin" /> : <Moon className="h-4 w-4 text-indigo-400" />}
              <span>{lightsOn ? "Dia (Sol)" : "Noite / Luzes"}</span>
            </button>

            <button
              onClick={handleToggleDoors}
              className="py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <DoorOpen className="h-4 w-4 text-emerald-600" />
              <span>Abrir Portas</span>
            </button>
          </div>
        </div>

        {/* Walkpad controller */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="grid grid-cols-3 gap-2 w-36">
            <div />
            <button
              onClick={() => walk(1)}
              title="Avançar (W)"
              className="bg-slate-900 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-all"
            >
              <ArrowUp className="h-5 w-5" />
            </button>
            <div />
            <button
              onClick={() => turn(-1)}
              title="Girar à Esquerda (A)"
              className="bg-slate-900 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => walk(-1)}
              title="Recuar (S)"
              className="bg-slate-900 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-all"
            >
              <ArrowDown className="h-5 w-5" />
            </button>
            <button
              onClick={() => turn(1)}
              title="Girar à Direita (D)"
              className="bg-slate-900 hover:bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center active:scale-95 cursor-pointer transition-all"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Materials Painting Palette (Módulo 3) */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="h-4 w-4 text-emerald-600" />
            <span>Aplicador de Materiais (Módulo 3)</span>
          </h4>

          <div className="space-y-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Superfície de Aplicação</label>
              <select
                value={activeSurfaceToPaint}
                onChange={(e: any) => setActiveSurfaceToPaint(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium"
              >
                <option value="floor">Piso (Chão)</option>
                <option value="wallNorth">Parede Norte (Fundo)</option>
                <option value="wallEast">Parede Leste (Direita)</option>
                <option value="wallSouth">Parede Sul (Frente)</option>
                <option value="wallWest">Parede Oeste (Esquerda)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Escolha o Material</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_MATERIALS.map((mat) => (
                  <button
                    key={mat.id}
                    onClick={() => {
                      setSelectedPaintMaterialId(mat.id);
                      onUpdateMaterials(activeSurfaceToPaint, mat);
                    }}
                    className={`p-1.5 border text-left rounded-lg transition-all ${
                      selectedPaintMaterialId === mat.id
                        ? "border-emerald-600 bg-emerald-50/50"
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: mat.color }} />
                      <span className="text-[10px] font-medium text-slate-700 truncate block max-w-[85px]">{mat.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: HTML5 3D Rendering Canvas */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 flex flex-col items-center relative">
        <canvas
          ref={canvasRef}
          width={640}
          height={420}
          className="bg-slate-950 rounded-xl shadow-inner border border-slate-800 max-w-full aspect-[16/10]"
        />

        {/* Quick Tips */}
        <div className="w-full mt-4 bg-slate-800/40 p-3.5 rounded-xl border border-slate-800 flex items-center gap-2.5 text-slate-400 text-xs leading-relaxed">
          <HelpCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p>
            <span className="text-slate-200 font-bold">Modo Imersivo:</span> Use os botões acima ou as teclas <kbd className="bg-slate-700 text-white px-1 py-0.5 rounded text-[10px] font-mono">W</kbd> <kbd className="bg-slate-700 text-white px-1 py-0.5 rounded text-[10px] font-mono">A</kbd> <kbd className="bg-slate-700 text-white px-1 py-0.5 rounded text-[10px] font-mono">S</kbd> <kbd className="bg-slate-700 text-white px-1 py-0.5 rounded text-[10px] font-mono">D</kbd> para caminhar dentro da sala e interagir em tempo real com o ambiente virtual.
          </p>
        </div>
      </div>
    </div>
  );
};
