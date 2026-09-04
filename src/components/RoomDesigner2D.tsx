import React, { useState, useRef, useEffect } from "react";
import { CatalogObject, PlacedObject, Material, CourseType, Wall } from "../types";
import { CATALOG_OBJECTS } from "../data";
import { 
  RotateCw, Trash2, Plus, Info, Move, AlertTriangle, 
  Eye, HelpCircle, CheckCircle, Search, Layers, Box, Compass,
  PenTool, MousePointer
} from "lucide-react";

interface RoomDesigner2DProps {
  course: CourseType;
  roomDimensions: { width: number; depth: number; height: number };
  onUpdateDimensions: (dims: { width: number; depth: number; height: number }) => void;
  placedObjects: PlacedObject[];
  onAddObject: (obj: PlacedObject) => void;
  onUpdateObject: (id: string, updated: Partial<PlacedObject>) => void;
  onRemoveObject: (id: string) => void;
  appliedMaterials: { floor: Material | null; wallNorth: Material | null; wallSouth: Material | null; wallEast: Material | null; wallWest: Material | null };
  walls: Wall[];
  onAddWall: (wall: Wall) => void;
  onRemoveWall: (id: string) => void;
}

export const RoomDesigner2D: React.FC<RoomDesigner2DProps> = ({
  course,
  roomDimensions,
  onUpdateDimensions,
  placedObjects,
  onAddObject,
  onUpdateObject,
  onRemoveObject,
  appliedMaterials,
  walls,
  onAddWall,
  onRemoveWall,
}) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<"select" | "wall">("select");
  const [activeWallStart, setActiveWallStart] = useState<{ x: number; y: number } | null>(null);
  const [activeWallCurrent, setActiveWallCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>("Recomendados");
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearance, setShowClearance] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement>(null);

  // Scaling factor: pixels per meter. If room is 5m wide, fits inside a 400px box.
  const scale = 75; // 75px = 1.0m
  const margin = 40; // padding around the room boundaries

  const canvasWidth = roomDimensions.width * scale + margin * 2;
  const canvasHeight = roomDimensions.depth * scale + margin * 2;

  // Filter Catalog
  const filteredCatalog = CATALOG_OBJECTS.filter((obj) => {
    // Search query match
    const matchesSearch = obj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          obj.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Filter by category
    if (activeCategory === "Recomendados") {
      if (course === CourseType.INTERIORS) return obj.category === "Residencial";
      if (course === CourseType.SPEECH_THERAPY) return obj.category === "Clínicas" && (obj.subcategory === "Fonoaudiologia" || obj.subcategory === "Audiologia");
      if (course === CourseType.PSYCHOLOGY) return obj.category === "Clínicas" && obj.subcategory === "Psicologia";
      if (course === CourseType.PHYSIOTHERAPY) return obj.category === "Clínicas" && obj.subcategory === "Fisioterapia";
      return obj.category === "Clínicas";
    }

    if (activeCategory === "Todos") return true;
    return obj.category === activeCategory || obj.subcategory === activeCategory;
  });

  const handleAddObjectToRoom = (catObj: CatalogObject) => {
    const newPlaced: PlacedObject = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      catalogId: catObj.id,
      name: catObj.name,
      category: catObj.category,
      subcategory: catObj.subcategory,
      x: roomDimensions.width / 2 - catObj.width / 2,
      y: roomDimensions.depth / 2 - catObj.depth / 2,
      width: catObj.width,
      depth: catObj.depth,
      height: catObj.height,
      rotation: 0,
      price: catObj.price,
      manufacturer: catObj.manufacturer,
      material: catObj.material,
      lightSource: catObj.svgIcon === "lamp",
      isLit: catObj.svgIcon === "lamp",
      isOpen: false
    };
    onAddObject(newPlaced);
    setSelectedObjectId(newPlaced.id);
  };

  const handleRotateSelected = () => {
    if (!selectedObjectId) return;
    const obj = placedObjects.find((o) => o.id === selectedObjectId);
    if (!obj) return;
    
    // Rotate in 90 degrees steps
    const newRotation = (obj.rotation + 90) % 360;
    
    // Swap width and depth visually
    onUpdateObject(selectedObjectId, { 
      rotation: newRotation,
      // If rotated 90 or 270, visual bounding dimensions might swap, but physical item remains.
      // We will handle rotation visually in rendering.
    });
  };

  const handleDragStart = (e: React.MouseEvent<SVGElement>, placedObj: PlacedObject) => {
    if (toolMode !== "select") return;
    e.stopPropagation();
    setSelectedObjectId(placedObj.id);
    setSelectedWallId(null);
    setIsDragging(true);

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    // Position of cursor relative to room coordinates in meters
    const cursorX = (e.clientX - rect.left - margin) / scale;
    const cursorY = (e.clientY - rect.top - margin) / scale;

    setDragOffset({
      x: cursorX - placedObj.x,
      y: cursorY - placedObj.y,
    });
  };

  const handleDragMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    
    const cursorX = (e.clientX - rect.left - margin) / scale;
    const cursorY = (e.clientY - rect.top - margin) / scale;

    const snappedX = Math.round(cursorX * 20) / 20;
    const snappedY = Math.round(cursorY * 20) / 20;

    if (toolMode === "wall" && activeWallStart) {
      setActiveWallCurrent({ x: snappedX, y: snappedY });
      return;
    }

    if (!isDragging || !selectedObjectId) return;

    const targetObj = placedObjects.find((o) => o.id === selectedObjectId);
    if (!targetObj) return;

    // Calculate new top-left coordinates with snapping to 5cm (0.05m) increments
    let newX = Math.round((cursorX - dragOffset.x) * 20) / 20;
    let newY = Math.round((cursorY - dragOffset.y) * 20) / 20;

    // Dimensions accounting for rotation
    const isRotatedVertical = targetObj.rotation === 90 || targetObj.rotation === 270;
    const w = isRotatedVertical ? targetObj.depth : targetObj.width;
    const d = isRotatedVertical ? targetObj.width : targetObj.depth;

    // Boundaries check
    if (newX < 0) newX = 0;
    if (newY < 0) newY = 0;
    if (newX + w > roomDimensions.width) newX = roomDimensions.width - w;
    if (newY + d > roomDimensions.depth) newY = roomDimensions.depth - d;

    onUpdateObject(selectedObjectId, { x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left - margin) / scale;
    const cursorY = (e.clientY - rect.top - margin) / scale;

    const snappedX = Math.round(cursorX * 20) / 20;
    const snappedY = Math.round(cursorY * 20) / 20;

    if (toolMode === "wall") {
      if (!activeWallStart) {
        // Start drawing wall
        setActiveWallStart({ x: snappedX, y: snappedY });
        setActiveWallCurrent({ x: snappedX, y: snappedY });
      } else {
        // End wall drawing and save wall!
        const dx = snappedX - activeWallStart.x;
        const dy = snappedY - activeWallStart.y;
        const length = Math.hypot(dx, dy);

        if (length >= 0.2) {
          const newWall: Wall = {
            id: `wall-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            x1: activeWallStart.x,
            y1: activeWallStart.y,
            x2: snappedX,
            y2: snappedY,
            thickness: 0.15, // 15cm thickness
            height: roomDimensions.height,
          };
          onAddWall(newWall);
        }
        setActiveWallStart(null);
        setActiveWallCurrent(null);
      }
    } else {
      // Clicked on empty space: clear selections
      setSelectedObjectId(null);
      setSelectedWallId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedObjectId) {
        onRemoveObject(selectedObjectId);
        setSelectedObjectId(null);
      } else if (selectedWallId) {
        onRemoveWall(selectedWallId);
        setSelectedWallId(null);
      }
    }
    if (e.key === "Escape") {
      setActiveWallStart(null);
      setActiveWallCurrent(null);
    }
  };

  const selectedObject = placedObjects.find((o) => o.id === selectedObjectId);
  const selectedCatalogInfo = selectedObject 
    ? CATALOG_OBJECTS.find((co) => co.id === selectedObject.catalogId) 
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Sidebar: Library and Search */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Box className="h-4 w-4 text-emerald-600" />
            <span>Biblioteca Inteligente</span>
          </h3>
          
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar mobiliário, cabines, etc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs border border-slate-200 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-100">
          {["Recomendados", "Todos", "Residencial", "Clínicas", "Equipamentos", "Comercial"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Object Cards List */}
        <div className="max-h-[310px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
          {filteredCatalog.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Nenhum objeto encontrado.</p>
          ) : (
            filteredCatalog.map((obj) => (
              <div
                key={obj.id}
                onClick={() => handleAddObjectToRoom(obj)}
                className="group border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <div className="bg-slate-50 group-hover:bg-emerald-100/50 p-2 rounded-lg border border-slate-100 transition-colors">
                    {/* Simplified SVG icon representations */}
                    <span className="text-xl">
                      {obj.category === "Equipamentos" ? "🔌" : obj.subcategory === "Sala" ? "🛋️" : "🪑"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{obj.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {obj.width}m × {obj.depth}m • R$ {obj.price}
                    </p>
                  </div>
                </div>
                <button className="bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-500 p-1.5 rounded-lg transition-all">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Dimensions Controller */}
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ajustar Dimensões do Cômodo</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Largura (m)</label>
              <input
                type="number"
                min="2.5"
                max="8.0"
                step="0.1"
                value={roomDimensions.width}
                onChange={(e) => onUpdateDimensions({ ...roomDimensions, width: parseFloat(e.target.value) || 3.0 })}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 text-xs rounded-lg p-1.5 font-semibold text-center focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Comprimento (m)</label>
              <input
                type="number"
                min="2.5"
                max="8.0"
                step="0.1"
                value={roomDimensions.depth}
                onChange={(e) => onUpdateDimensions({ ...roomDimensions, depth: parseFloat(e.target.value) || 3.0 })}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 text-xs rounded-lg p-1.5 font-semibold text-center focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase">Pé Direito (m)</label>
              <input
                type="number"
                min="2.2"
                max="3.5"
                step="0.05"
                value={roomDimensions.height}
                onChange={(e) => onUpdateDimensions({ ...roomDimensions, height: parseFloat(e.target.value) || 2.7 })}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 text-xs rounded-lg p-1.5 font-semibold text-center focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center Grid: Interactive SVG Canvas Planner */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl shadow-inner p-4 flex flex-col items-center justify-center relative min-h-[440px]">
          {/* Controls Bar */}
          <div className="absolute top-4 left-4 z-10 flex gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setToolMode("select");
                setActiveWallStart(null);
                setActiveWallCurrent(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                toolMode === "select"
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm"
              }`}
            >
              <MousePointer className="h-3.5 w-3.5" />
              <span>Móveis (Arrastar/Mover)</span>
            </button>

            <button
              onClick={() => {
                setToolMode("wall");
                setSelectedObjectId(null);
                setSelectedWallId(null);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                toolMode === "wall"
                  ? "bg-indigo-600 text-white shadow-md animate-pulse"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800 shadow-sm"
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Paredes 3D (BIM)</span>
            </button>

            <button
              onClick={() => setShowClearance(!showClearance)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                showClearance
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>{showClearance ? "Margens On" : "Margens Off"}</span>
            </button>

            {(selectedObjectId || selectedWallId) && (
              <button
                onClick={() => {
                  if (selectedObjectId) {
                    onRemoveObject(selectedObjectId);
                    setSelectedObjectId(null);
                  } else if (selectedWallId) {
                    onRemoveWall(selectedWallId);
                    setSelectedWallId(null);
                  }
                }}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white shadow-sm flex items-center gap-1 hover:bg-rose-700 cursor-pointer transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir Selecionado</span>
              </button>
            )}
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-slate-200/50 text-[10px] text-slate-500 font-mono px-2.5 py-1 rounded-lg border border-slate-300/40">
            <Compass className="h-3.5 w-3.5" />
            <span>Grade: 5cm Snapping</span>
          </div>

          {/* Canvas SVG */}
          <div className="overflow-auto max-w-full p-2 bg-white rounded-xl shadow-sm border border-slate-200/60">
            <svg
              ref={svgRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onClick={handleCanvasClick}
              className={`bg-slate-50 select-none cursor-default ${toolMode === "wall" ? "cursor-crosshair" : "cursor-default"}`}
            >
              <defs>
                {/* 10cm sub-grid and 50cm main grid patterns */}
                <pattern id="smallGrid" width={scale * 0.1} height={scale * 0.1} patternUnits="userSpaceOnUse">
                  <path d={`M ${scale * 0.1} 0 L 0 0 0 ${scale * 0.1}`} fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                </pattern>
                <pattern id="grid" width={scale * 0.5} height={scale * 0.5} patternUnits="userSpaceOnUse">
                  <rect width={scale * 0.5} height={scale * 0.5} fill="url(#smallGrid)" />
                  <path d={`M ${scale * 0.5} 0 L 0 0 0 ${scale * 0.5}`} fill="none" stroke="#cbd5e1" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Grid Background in room space */}
              <rect
                x={margin}
                y={margin}
                width={roomDimensions.width * scale}
                height={roomDimensions.depth * scale}
                fill="url(#grid)"
              />

              {/* Floor Material overlay if applied */}
              {appliedMaterials.floor && (
                <rect
                  x={margin}
                  y={margin}
                  width={roomDimensions.width * scale}
                  height={roomDimensions.depth * scale}
                  fill={appliedMaterials.floor.color}
                  fillOpacity="0.15"
                />
              )}

              {/* Grid Ruler lines along the borders */}
              {/* Vertical rulers */}
              {Array.from({ length: Math.ceil(roomDimensions.width) + 1 }).map((_, i) => (
                <text
                  key={`ruler-w-${i}`}
                  x={margin + i * scale}
                  y={margin - 8}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-mono font-bold"
                >
                  {i}m
                </text>
              ))}
              {/* Horizontal rulers */}
              {Array.from({ length: Math.ceil(roomDimensions.depth) + 1 }).map((_, i) => (
                <text
                  key={`ruler-d-${i}`}
                  x={margin - 12}
                  y={margin + i * scale + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-mono font-bold"
                >
                  {i}m
                </text>
              ))}

              {/* Placed Objects Rendering */}
              {placedObjects.map((obj) => {
                const isSelected = obj.id === selectedObjectId;
                const isRotatedVertical = obj.rotation === 90 || obj.rotation === 270;
                
                // Rotated width and depth
                const drawW = obj.width * scale;
                const drawD = obj.depth * scale;
                const drawX = margin + obj.x * scale;
                const drawY = margin + obj.y * scale;

                const centerX = drawX + drawW / 2;
                const centerY = drawY + drawD / 2;

                return (
                  <g key={obj.id} className="cursor-move">
                    {/* Accessibility/Ergonomics Clearance rings (Dashed red/yellow boundary) */}
                    {showClearance && isSelected && (
                      <g>
                        {/* 60cm Ergonomics Buffer */}
                        <rect
                          x={drawX - 0.6 * scale}
                          y={drawY - 0.6 * scale}
                          width={drawW + 1.2 * scale}
                          height={drawD + 1.2 * scale}
                          rx={8}
                          fill="none"
                          stroke="#eab308"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          strokeOpacity="0.75"
                        />
                        <text
                          x={drawX}
                          y={drawY - 0.6 * scale - 4}
                          className="fill-amber-600 text-[8px] font-semibold font-mono"
                        >
                          ZONA ERGONÔMICA (60cm)
                        </text>

                        {/* 1.20m Accessibility Buffer (for heavy clinical items) */}
                        {(course === CourseType.PHYSIOTHERAPY || obj.category === "Equipamentos") && (
                          <>
                            <rect
                              x={drawX - 1.2 * scale}
                              y={drawY - 1.2 * scale}
                              width={drawW + 2.4 * scale}
                              height={drawD + 2.4 * scale}
                              rx={12}
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="1.5"
                              strokeDasharray="6 4"
                              strokeOpacity="0.5"
                            />
                            <text
                              x={drawX}
                              y={drawY - 1.2 * scale - 4}
                              className="fill-indigo-600 text-[8px] font-semibold font-mono"
                            >
                              NBR 9050 ACESSIBILIDADE (1.20m)
                            </text>
                          </>
                        )}
                      </g>
                    )}

                    {/* Main Object Body */}
                    <g
                      transform={`rotate(${obj.rotation}, ${centerX}, ${centerY})`}
                      onMouseDown={(e) => handleDragStart(e, obj)}
                    >
                      {/* Generic Base Rect as Fallback and click area */}
                      <rect
                        x={drawX}
                        y={drawY}
                        width={drawW}
                        height={drawD}
                        rx={4}
                        fill={isSelected ? "#ecfdf5" : "#ffffff"}
                        stroke={isSelected ? "#10b981" : "#475569"}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        className="transition-colors shadow-sm"
                        fillOpacity={isSelected ? 0.95 : 0.9}
                      />

                      {/* Custom CAD Vector Illustration matching the Catalog item */}
                      {(() => {
                        switch (obj.catalogId) {
                          case "obj-res-sofa":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Backrest cushion */}
                                <rect x={drawX} y={drawY} width={drawW} height={drawD * 0.25} rx={2} fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                                {/* Left armrest */}
                                <rect x={drawX} y={drawY} width={drawW * 0.1} height={drawD} rx={2} fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                                {/* Right armrest */}
                                <rect x={drawX + drawW * 0.9} y={drawY} width={drawW * 0.1} height={drawD} rx={2} fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                                {/* Seat sections (3 cushion cuts) */}
                                <rect x={drawX + drawW * 0.1} y={drawY + drawD * 0.25} width={drawW * 0.26} height={drawD * 0.75} rx={1} fill="#f1f5f9" stroke="#475569" strokeWidth="0.75" />
                                <rect x={drawX + drawW * 0.36} y={drawY + drawD * 0.25} width={drawW * 0.28} height={drawD * 0.75} rx={1} fill="#f1f5f9" stroke="#475569" strokeWidth="0.75" />
                                <rect x={drawX + drawW * 0.64} y={drawY + drawD * 0.25} width={drawW * 0.26} height={drawD * 0.75} rx={1} fill="#f1f5f9" stroke="#475569" strokeWidth="0.75" />
                                {/* Cushion lines */}
                                <line x1={drawX + drawW * 0.1} y1={drawY + drawD * 0.5} x2={drawX + drawW * 0.9} y2={drawY + drawD * 0.5} stroke="#94a3b8" strokeWidth="0.5" />
                              </g>
                            );
                          case "obj-res-mesatrabalho":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Tabletop wood tint overlay */}
                                <rect x={drawX + 3} y={drawY + 3} width={drawW - 6} height={drawD - 6} fill="#fef3c7" opacity="0.3" />
                                {/* Desktop monitor monitor outline */}
                                <rect x={drawX + drawW * 0.2} y={drawY + drawD * 0.12} width={drawW * 0.6} height={5} rx={1} fill="#334155" stroke="#1e293b" strokeWidth="1" />
                                {/* Keyboard outline */}
                                <rect x={drawX + drawW * 0.32} y={drawY + drawD * 0.45} width={drawW * 0.36} height={drawD * 0.22} rx={1} fill="#f8fafc" stroke="#475569" strokeWidth="1" />
                                {/* Keyboard keys lines */}
                                <line x1={drawX + drawW * 0.35} y1={drawY + drawD * 0.51} x2={drawX + drawW * 0.65} y2={drawY + drawD * 0.51} stroke="#cbd5e1" strokeWidth="0.75" />
                                <line x1={drawX + drawW * 0.35} y1={drawY + drawD * 0.58} x2={drawX + drawW * 0.65} y2={drawY + drawD * 0.58} stroke="#cbd5e1" strokeWidth="0.75" />
                                {/* Coffee Cup circle */}
                                <circle cx={drawX + drawW * 0.8} cy={drawY + drawD * 0.35} r={4} fill="#f1f5f9" stroke="#475569" strokeWidth="0.75" />
                                <circle cx={drawX + drawW * 0.8} cy={drawY + drawD * 0.35} r={2.2} fill="#78350f" />
                              </g>
                            );
                          case "obj-res-cadeiraergonomica":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Five legs radiating */}
                                <line x1={centerX} y1={centerY} x2={centerX - 12} y2={centerY - 12} stroke="#94a3b8" strokeWidth="1.5" />
                                <line x1={centerX} y1={centerY} x2={centerX + 12} y2={centerY - 12} stroke="#94a3b8" strokeWidth="1.5" />
                                <line x1={centerX} y1={centerY} x2={centerX - 15} y2={centerY + 8} stroke="#94a3b8" strokeWidth="1.5" />
                                <line x1={centerX} y1={centerY} x2={centerX + 15} y2={centerY + 8} stroke="#94a3b8" strokeWidth="1.5" />
                                <line x1={centerX} y1={centerY} x2={centerX} y2={centerY + 16} stroke="#94a3b8" strokeWidth="1.5" />
                                {/* Seat pad circular outline */}
                                <circle cx={centerX} cy={centerY} r={Math.min(drawW, drawD) * 0.38} fill="#f1f5f9" stroke="#475569" strokeWidth="1" />
                                {/* Backrest cushion */}
                                <path d={`M ${centerX - drawW * 0.3} ${drawY + 3} Q ${centerX} ${drawY - 1} ${centerX + drawW * 0.3} ${drawY + 3} L ${centerX + drawW * 0.25} ${drawY + drawD * 0.18} Q ${centerX} ${drawY + drawD * 0.12} ${centerX - drawW * 0.25} ${drawY + drawD * 0.18} Z`} fill="#334155" stroke="#1e293b" strokeWidth="1" />
                                {/* Left armrest */}
                                <rect x={centerX - drawW * 0.44} y={centerY - drawD * 0.12} width={4} height={drawD * 0.36} rx={1} fill="#475569" />
                                {/* Right armrest */}
                                <rect x={centerX + drawW * 0.38} y={centerY - drawD * 0.12} width={4} height={drawD * 0.36} rx={1} fill="#475569" />
                              </g>
                            );
                          case "obj-res-vasoplantas":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Outer Ceramic Pot */}
                                <circle cx={centerX} cy={centerY} r={Math.min(drawW, drawD) * 0.42} fill="#ea580c" stroke="#475569" strokeWidth="1" />
                                {/* Soil */}
                                <circle cx={centerX} cy={centerY} r={Math.min(drawW, drawD) * 0.3} fill="#78350f" />
                                {/* Green biofilia leaves radiating out */}
                                <path d={`M ${centerX} ${centerY} Q ${centerX - 15} ${centerY - 15} ${centerX - 24} ${centerY - 22}`} fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                                <path d={`M ${centerX} ${centerY} Q ${centerX + 15} ${centerY - 15} ${centerX + 24} ${centerY - 22}`} fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
                                <path d={`M ${centerX} ${centerY} Q ${centerX - 20} ${centerY + 2} ${centerX - 28} ${centerY + 2}`} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                                <path d={`M ${centerX} ${centerY} Q ${centerX + 20} ${centerY + 2} ${centerX + 28} ${centerY + 2}`} fill="none" stroke="#15803d" strokeWidth="3.2" strokeLinecap="round" />
                                <path d={`M ${centerX} ${centerY} Q ${centerX - 10} ${centerY + 18} ${centerX - 16} ${centerY + 24}`} fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                                <path d={`M ${centerX} ${centerY} Q ${centerX + 10} ${centerY + 18} ${centerX + 16} ${centerY + 24}`} fill="none" stroke="#15803d" strokeWidth="2.8" strokeLinecap="round" />
                                <circle cx={centerX} cy={centerY} r={4} fill="#14532d" />
                              </g>
                            );
                          case "obj-cli-macafisio":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Bed base texture */}
                                <rect x={drawX + 4} y={drawY + 4} width={drawW - 8} height={drawD - 8} fill="#f0fdfa" rx={2} />
                                {/* Longitudinal seam lines */}
                                <line x1={drawX} y1={drawY + drawD * 0.5} x2={drawX + drawW} y2={drawY + drawD * 0.5} stroke="#cbd5e1" strokeWidth="0.75" />
                                {/* Padded Pillow block */}
                                <rect x={drawX + 3} y={drawY + 3} width={drawW * 0.22} height={drawD - 6} rx={3} fill="#ccfbf1" stroke="#0d9488" strokeWidth="1" />
                                <ellipse cx={drawX + drawW * 0.11} cy={centerY} rx={8} ry={5} fill="#ffffff" stroke="#0d9488" strokeWidth="0.75" />
                                {/* Paper sheet roll holder at the bottom */}
                                <rect x={drawX + drawW * 0.9} y={centerY - 8} width={6} height={16} rx={1} fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                              </g>
                            );
                          case "obj-cli-divan":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Velvet divan base */}
                                <rect x={drawX + 3} y={drawY + 3} width={drawW - 6} height={drawD - 6} fill="#f5f5f4" rx={4} />
                                {/* Tufted Button points (conforming clinical design) */}
                                {[0.35, 0.5, 0.65, 0.8].map((xp, idx) => (
                                  <g key={idx}>
                                    <circle cx={drawX + drawW * xp} cy={drawY + drawD * 0.3} r={1.5} fill="#78350f" />
                                    <circle cx={drawX + drawW * xp} cy={drawY + drawD * 0.7} r={1.5} fill="#78350f" />
                                  </g>
                                ))}
                                {/* Headrest pillow raised section */}
                                <path d={`M ${drawX} ${drawY} L ${drawX + drawW * 0.25} ${drawY} C ${drawX + drawW * 0.28} ${centerY} ${drawX + drawW * 0.28} ${centerY} ${drawX + drawW * 0.25} ${drawY + drawD} L ${drawX} ${drawY + drawD} Z`} fill="#d6d3d1" stroke="#78350f" strokeWidth="1" />
                              </g>
                            );
                          case "obj-eq-cabineacustica":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Heavy Soundproof Double walls */}
                                <rect x={drawX + 4} y={drawY + 4} width={drawW - 8} height={drawD - 8} fill="#f8fafc" stroke="#475569" strokeWidth="2" />
                                {/* Sound absorbing inside acoustic wedge grids */}
                                <line x1={drawX + 8} y1={drawY + 8} x2={drawX + drawW - 8} y2={drawY + 8} stroke="#cbd5e1" strokeWidth="3" strokeDasharray="3 2" />
                                <line x1={drawX + 8} y1={drawY + drawD - 8} x2={drawX + drawW - 8} y2={drawY + drawD - 8} stroke="#cbd5e1" strokeWidth="3" strokeDasharray="3 2" />
                                {/* Internal ergonomic patient stool */}
                                <circle cx={centerX} cy={centerY} r={Math.min(drawW, drawD) * 0.18} fill="#ec4899" stroke="#db2777" strokeWidth="1" />
                                <circle cx={centerX} cy={centerY} r={3} fill="#ffffff" />
                                {/* Glazed Heavy Window/Door representation */}
                                <line x1={drawX + 4} y1={drawY + drawD * 0.85} x2={drawX + drawW - 4} y2={drawY + drawD * 0.85} stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
                                <text x={centerX} y={drawY + drawD - 12} textAnchor="middle" className="fill-sky-600 text-[6px] font-bold font-mono">ISOLAMENTO MÁXIMO</text>
                              </g>
                            );
                          case "obj-eq-audiometro":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Interactive Display screen */}
                                <rect x={drawX + 6} y={drawY + 4} width={drawW - 12} height={drawD * 0.38} rx={1} fill="#0f172a" stroke="#475569" strokeWidth="0.75" />
                                {/* Screen audiometric wave line */}
                                <path d={`M ${drawX + 10} ${drawY + 12} Q ${centerX - 10} ${drawY + 6} ${centerX} ${drawY + 12} T ${drawX + drawW - 10} ${drawY + 12}`} fill="none" stroke="#22c55e" strokeWidth="1" />
                                {/* Knobs / Dials */}
                                <circle cx={drawX + drawW * 0.28} cy={drawY + drawD * 0.72} r={3} fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                                <line x1={drawX + drawW * 0.28} y1={drawY + drawD * 0.72} x2={drawX + drawW * 0.28} y2={drawY + drawD * 0.62} stroke="#334155" strokeWidth="1" />
                                <circle cx={drawX + drawW * 0.72} cy={drawY + drawD * 0.72} r={3} fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                                <line x1={drawX + drawW * 0.72} y1={drawY + drawD * 0.72} x2={drawX + drawW * 0.8} y2={drawY + drawD * 0.68} stroke="#334155" strokeWidth="1" />
                                {/* Small key buttons */}
                                <rect x={centerX - 5} y={drawY + drawD * 0.66} width={10} height={4} rx={0.5} fill="#cbd5e1" stroke="#475569" strokeWidth="0.5" />
                              </g>
                            );
                          case "obj-cli-mesainfantil":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Rounded activity table top */}
                                <circle cx={centerX} cy={centerY} r={Math.min(drawW, drawD) * 0.34} fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                                {/* Multi-colored stools around the table (4 nodes) */}
                                <circle cx={centerX - drawW * 0.38} cy={centerY} r={5} fill="#ef4444" stroke="#475569" strokeWidth="0.75" />
                                <circle cx={centerX + drawW * 0.38} cy={centerY} r={5} fill="#3b82f6" stroke="#475569" strokeWidth="0.75" />
                                <circle cx={centerX} cy={centerY - drawD * 0.38} r={5} fill="#10b981" stroke="#475569" strokeWidth="0.75" />
                                <circle cx={centerX} cy={centerY + drawD * 0.38} r={5} fill="#f59e0b" stroke="#475569" strokeWidth="0.75" />
                              </g>
                            );
                          case "obj-res-armario":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Corner clothes line hanger rod */}
                                <line x1={drawX + 5} y1={drawY + 5} x2={drawX + drawW - 5} y2={drawY + 5} stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 1" />
                                <rect x={drawX + 4} y={drawY + 4} width={drawW - 8} height={drawD - 8} fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                                {/* Double door swings */}
                                <path d={`M ${drawX} ${drawY + drawD} A ${drawW * 0.5} ${drawW * 0.5} 0 0 1 ${centerX} ${drawY + drawD + drawW * 0.5}`} fill="none" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="2 2" />
                                <path d={`M ${drawX + drawW} ${drawY + drawD} A ${drawW * 0.5} ${drawW * 0.5} 0 0 0 ${centerX} ${drawY + drawD + drawW * 0.5}`} fill="none" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="2 2" />
                              </g>
                            );
                          case "obj-res-mesacentro":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Organic wood-grained center table */}
                                <ellipse cx={centerX} cy={centerY} rx={drawW * 0.42} ry={drawD * 0.42} fill="#d7b282" stroke="#8b5a2b" strokeWidth="1.5" />
                                <ellipse cx={centerX - 2} cy={centerY + 1} rx={drawW * 0.28} ry={drawD * 0.25} fill="none" stroke="#b45309" strokeWidth="0.75" opacity="0.6" />
                                <ellipse cx={centerX - 4} cy={centerY + 2} rx={drawW * 0.15} ry={drawD * 0.12} fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.4" />
                              </g>
                            );
                          case "obj-eq-espaldar":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Wood wall rack ladder / stall bars */}
                                <rect x={drawX + 2} y={drawY + 2} width={drawW - 4} height={drawD - 4} fill="#fef08a" opacity="0.15" />
                                {/* Vertical supports */}
                                <rect x={drawX} y={drawY} width={5} height={drawD} fill="#a16207" />
                                <rect x={drawX + drawW - 5} y={drawY} width={5} height={drawD} fill="#a16207" />
                                {/* Horizontal cylinder rungs */}
                                {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85].map((yp, idx) => (
                                  <line key={idx} x1={drawX} y1={drawY + drawD * yp} x2={drawX + drawW} y2={drawY + drawD * yp} stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
                                ))}
                              </g>
                            );
                          case "obj-eq-barrasparalelas":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Floor wooden base walkway */}
                                <rect x={drawX + 2} y={drawY + 2} width={drawW - 4} height={drawD - 4} fill="#fef08a" opacity="0.25" stroke="#ca8a04" strokeWidth="0.75" />
                                {/* Metallic double parallel bars */}
                                <line x1={drawX} y1={drawY + drawD * 0.25} x2={drawX + drawW} y2={drawY + drawD * 0.25} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                                <line x1={drawX} y1={drawY + drawD * 0.75} x2={drawX + drawW} y2={drawY + drawD * 0.75} stroke="#475569" strokeWidth="3" strokeLinecap="round" />
                                {/* Vertical support posts */}
                                {[0.1, 0.5, 0.9].map((xp, idx) => (
                                  <g key={idx}>
                                    <circle cx={drawX + drawW * xp} cy={drawY + drawD * 0.25} r={2.5} fill="#1e293b" />
                                    <circle cx={drawX + drawW * xp} cy={drawY + drawD * 0.75} r={2.5} fill="#1e293b" />
                                  </g>
                                ))}
                              </g>
                            );
                          case "obj-com-luminariadireta":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Heavy base */}
                                <circle cx={centerX} cy={centerY} r={6} fill="#334155" stroke="#1e293b" />
                                {/* Shade */}
                                <circle cx={centerX} cy={centerY} r={10} fill="#f59e0b" stroke="#ca8a04" strokeWidth="1" />
                                {/* Glowing halo circle to demonstrate lighting coverage */}
                                <circle cx={centerX} cy={centerY} r={drawW * 2.5} fill="none" stroke="#fef08a" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.75 animate-pulse" />
                              </g>
                            );
                          case "obj-com-biombo":
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Folding zigzag acoustic partition panel */}
                                <polyline
                                  points={`${drawX + 2},${centerY} ${drawX + drawW * 0.25},${centerY - 8} ${drawX + drawW * 0.5},${centerY + 8} ${drawX + drawW * 0.75},${centerY - 8} ${drawX + drawW - 2},${centerY}`}
                                  fill="none"
                                  stroke="#f59e0b"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </g>
                            );
                          default:
                            return (
                              <g style={{ pointerEvents: "none" }}>
                                {/* Generic accent category color bar if no custom vector matches */}
                                <rect
                                  x={drawX}
                                  y={drawY}
                                  width={drawW}
                                  height={Math.min(6, drawD)}
                                  fill={obj.category === "Equipamentos" ? "#6366f1" : obj.category === "Clínicas" ? "#ec4899" : "#10b981"}
                                  rx={1}
                                />
                                <text x={centerX} y={centerY + 3} textAnchor="middle" className="text-[12px]">
                                  {obj.category === "Equipamentos" ? "🔌" : "🪑"}
                                </text>
                              </g>
                            );
                        }
                      })()}

                      {/* Direction arrow (so user knows where front of chair/sofa is!) */}
                      <path
                        d={`M ${centerX - 6} ${drawY + drawD - 10} L ${centerX} ${drawY + drawD - 4} L ${centerX + 6} ${drawY + drawD - 10}`}
                        fill="none"
                        stroke={isSelected ? "#10b981" : "#94a3b8"}
                        strokeWidth="1.5"
                        style={{ pointerEvents: "none" }}
                      />

                      {/* Label */}
                      <text
                        x={centerX}
                        y={drawY + drawD - 14}
                        textAnchor="middle"
                        className="fill-slate-600 text-[8px] font-black pointer-events-none"
                      >
                        {obj.name.length > 15 ? `${obj.name.substr(0, 14)}...` : obj.name}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Drawn Walls rendering (SketchUp & Revit style concrete double-line cuts) */}
              {walls.map((wall) => {
                const isSelected = wall.id === selectedWallId;
                const dx = wall.x2 - wall.x1;
                const dy = wall.y2 - wall.y1;
                const length = Math.hypot(dx, dy);
                const wallThicknessInPixels = wall.thickness * scale;

                return (
                  <g key={wall.id} className="cursor-pointer" onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWallId(wall.id);
                    setSelectedObjectId(null);
                  }}>
                    {/* Glowing highlight selection */}
                    {isSelected && (
                      <line
                        x1={margin + wall.x1 * scale}
                        y1={margin + wall.y1 * scale}
                        x2={margin + wall.x2 * scale}
                        y2={margin + wall.y2 * scale}
                        stroke="#10b981"
                        strokeWidth={wallThicknessInPixels + 6}
                        strokeLinecap="round"
                        opacity="0.5"
                      />
                    )}

                    {/* Outer Wall Body (Thick slate double-line representation) */}
                    <line
                      x1={margin + wall.x1 * scale}
                      y1={margin + wall.y1 * scale}
                      x2={margin + wall.x2 * scale}
                      y2={margin + wall.y2 * scale}
                      stroke="#475569"
                      strokeWidth={wallThicknessInPixels}
                      strokeLinecap="round"
                    />

                    {/* Inner core line representing concrete/brick core */}
                    <line
                      x1={margin + wall.x1 * scale}
                      y1={margin + wall.y1 * scale}
                      x2={margin + wall.x2 * scale}
                      y2={margin + wall.y2 * scale}
                      stroke="#e2e8f0"
                      strokeWidth={Math.max(1, wallThicknessInPixels - 4)}
                      strokeLinecap="round"
                    />

                    {/* Dimension Label */}
                    <text
                      x={margin + ((wall.x1 + wall.x2) / 2) * scale}
                      y={margin + ((wall.y1 + wall.y2) / 2) * scale - 8}
                      textAnchor="middle"
                      className="fill-slate-800 text-[9px] font-mono font-bold pointer-events-none select-none"
                    >
                      {length.toFixed(2)}m
                    </text>
                  </g>
                );
              })}

              {/* Active Wall Drawing Segment (Line-based preview) */}
              {toolMode === "wall" && activeWallStart && activeWallCurrent && (
                <g className="pointer-events-none">
                  {/* Outer preview */}
                  <line
                    x1={margin + activeWallStart.x * scale}
                    y1={margin + activeWallStart.y * scale}
                    x2={margin + activeWallCurrent.x * scale}
                    y2={margin + activeWallCurrent.y * scale}
                    stroke="#6366f1"
                    strokeWidth={0.15 * scale}
                    strokeLinecap="round"
                    strokeDasharray="4 4"
                    opacity="0.6"
                  />
                  
                  {/* Central line guide */}
                  <line
                    x1={margin + activeWallStart.x * scale}
                    y1={margin + activeWallStart.y * scale}
                    x2={margin + activeWallCurrent.x * scale}
                    y2={margin + activeWallCurrent.y * scale}
                    stroke="#4f46e5"
                    strokeWidth="2"
                  />

                  {/* Length Label */}
                  <text
                    x={margin + ((activeWallStart.x + activeWallCurrent.x) / 2) * scale}
                    y={margin + ((activeWallStart.y + activeWallCurrent.y) / 2) * scale - 12}
                    textAnchor="middle"
                    className="fill-indigo-700 font-mono text-[10px] font-bold"
                  >
                    {Math.hypot(activeWallCurrent.x - activeWallStart.x, activeWallCurrent.y - activeWallStart.y).toFixed(2)}m
                  </text>
                  
                  {/* Start Point marker */}
                  <circle
                    cx={margin + activeWallStart.x * scale}
                    cy={margin + activeWallStart.y * scale}
                    r="4"
                    fill="#4f46e5"
                  />
                  {/* Current Cursor marker */}
                  <circle
                    cx={margin + activeWallCurrent.x * scale}
                    cy={margin + activeWallCurrent.y * scale}
                    r="4"
                    fill="#10b981"
                  />
                </g>
              )}

              {/* Room Boundary Walls (Thick black frame) */}
              <rect
                x={margin}
                y={margin}
                width={roomDimensions.width * scale}
                height={roomDimensions.depth * scale}
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
                className="pointer-events-none"
              />

              {/* Draw static doors and window helpers */}
              {/* Door representation (standard 80cm door on south-west) */}
              <g transform={`translate(${margin + 20}, ${margin + roomDimensions.depth * scale - 4})`}>
                <rect x={0} y={-4} width={0.8 * scale} height={8} fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
                <path d={`M 0 0 A ${0.8 * scale} ${0.8 * scale} 0 0 1 ${0.8 * scale} ${-0.8 * scale}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x={0.4 * scale} y={-10} textAnchor="middle" className="fill-slate-500 text-[8px] font-mono font-bold">Porta (80cm)</text>
              </g>

              {/* Window representation (standard 1.2m window on north-east) */}
              <g transform={`translate(${margin + roomDimensions.width * scale - 1.5 * scale}, ${margin - 4})`}>
                <rect x={0} y={0} width={1.2 * scale} height={8} fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.5" />
                <line x1={0} y1={4} x2={1.2 * scale} y2={4} stroke="#10b981" strokeWidth="1.5" />
                <text x={0.6 * scale} y={16} textAnchor="middle" className="fill-slate-500 text-[8px] font-mono font-bold">Janela (1.2m)</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Selected Object Details Panel / Action Bar */}
        {selectedObject ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                  {selectedObject.category} • {selectedObject.subcategory}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Posição: X:{selectedObject.x.toFixed(2)}m, Y:{selectedObject.y.toFixed(2)}m
                </span>
              </div>
              <h4 className="text-md font-bold text-slate-100">{selectedObject.name}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1.5 text-xs text-slate-300 font-mono">
                <div>
                  <span className="text-slate-500">Fabricante:</span> {selectedObject.manufacturer}
                </div>
                <div>
                  <span className="text-slate-500">Dimensões:</span> {selectedObject.width}x{selectedObject.depth}x{selectedObject.height}m
                </div>
                <div>
                  <span className="text-slate-500">Valor Estimado:</span> R$ {selectedObject.price.toLocaleString("pt-BR")}
                </div>
              </div>

              {selectedCatalogInfo && (
                <div className="border-t border-slate-800 mt-2 pt-2 space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  <p>
                    <span className="text-emerald-500 font-bold uppercase text-[10px]">Normas relacionadas:</span> {selectedCatalogInfo.norms}
                  </p>
                  <p>
                    <span className="text-emerald-500 font-bold uppercase text-[10px]">Sustentabilidade:</span> {selectedCatalogInfo.sustainability}
                  </p>
                  <p>
                    <span className="text-emerald-500 font-bold uppercase text-[10px]">Acessibilidade NBR 9050:</span> {selectedCatalogInfo.accessibility}
                  </p>
                </div>
              )}
            </div>

            <div className="flex sm:flex-col md:flex-row gap-2.5 w-full md:w-auto">
              <button
                onClick={handleRotateSelected}
                className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
              >
                <RotateCw className="h-4 w-4 text-emerald-400" />
                <span>Rotacionar 90°</span>
              </button>
              <button
                onClick={() => {
                  onRemoveObject(selectedObject.id);
                  setSelectedObjectId(null);
                }}
                className="flex-1 sm:flex-none bg-rose-950/80 hover:bg-rose-900/90 text-rose-200 border border-rose-800 p-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
              >
                <Trash2 className="h-4 w-4 text-rose-400" />
                <span>Remover item</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Info className="h-4 w-4 text-slate-400" />
            <span>Selecione ou clique em qualquer móvel no canvas para rotacionar, reposicionar ou conferir a ficha técnica integrada.</span>
          </div>
        )}
      </div>
    </div>
  );
};
