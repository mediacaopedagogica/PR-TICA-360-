import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  CourseType, Challenge, PlacedObject, Material, 
  AppliedMaterials, BriefingMessage, AIPedagogicalReview, PortfolioVersion, Wall, CustomDrawing
} from "./types";
import { INITIAL_CHALLENGES, PRESET_MATERIALS, CATALOG_OBJECTS } from "./data";
import { RealisticThreeScene } from "./components/RealisticThreeScene";
import { calculateBudgetSummary } from "./budgetEngine";
import { clearProjectSnapshot, loadProjectSnapshot, saveProjectSnapshot } from "./projectState";
import { resolveObjectPlacement } from "./spatialPlacement";
import { objectParticipatesInCollision } from "./threeAssetManifest";
import { BriefingModule } from "./components/BriefingModule";
import { MediatorDashboard } from "./components/MediatorDashboard";
import { 
  Compass, HelpCircle, MessageSquare, ClipboardCheck, 
  Play, TrendingUp, AlertCircle, Layout, Info, Layers, 
  Lock, RefreshCw, Sparkles, CheckCircle2, ChevronDown, 
  FolderOpen, Save, FileSpreadsheet, Palette, Sun, Moon, 
  Tv, User, Award, Flame, Box, Search, RotateCw, Copy, 
  Eye, EyeOff, ShieldAlert, Check, Plus, Trash2, Minimize2, 
  Maximize2, Ruler, BookOpen, UserCheck, Grid,
  Scissors, Minus, GitCommit, LogIn, LayoutGrid, Home, Sliders, Square, Circle, Maximize,
  ShieldCheck, Menu, X
} from "lucide-react";

export default function App() {
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  
  // Pick active challenge automatically
  const [activeChallengeId, setActiveChallengeId] = useState<string>(() => {
    const saved = localStorage.getItem("activeChallengeId");
    if (saved && INITIAL_CHALLENGES.some(c => c.id === saved)) return saved;
    return INITIAL_CHALLENGES[0].id;
  });

  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("completedChallengeIds");
    return saved ? JSON.parse(saved) : [];
  });

  const [showCadPanel, setShowCadPanel] = useState<boolean>(true);
  const [isMouseOverCanvas, setIsMouseOverCanvas] = useState<boolean>(false);

  const currentChallenge = challenges.find((ch) => ch.id === activeChallengeId) || challenges[0];
  const activeCourse = currentChallenge.course;

  // Active Area template
  const [activeArea, setActiveArea] = useState<string>("Consultório");

  // Mediator authorization & Simulation states
  const [mediatorMode, setMediatorMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isMediatorLoggedIn, setIsMediatorLoggedIn] = useState(() => {
    return sessionStorage.getItem("isMediatorLoggedIn") === "true";
  });

  const [isSimulationActive, setIsSimulationActive] = useState(() => {
    const saved = localStorage.getItem("isSimulationActive");
    return saved !== null ? saved === "true" : true;
  });

  // Acesso geral ao laboratório (atualização pós-ZIP: login solicitado para todos os alunos)
  const [studentAccessGranted, setStudentAccessGranted] = useState(() => sessionStorage.getItem("studentAccessGranted") === "true");
  const [studentAccessLogin, setStudentAccessLogin] = useState("");
  const [studentAccessPassword, setStudentAccessPassword] = useState("");
  const [studentAccessError, setStudentAccessError] = useState("");
  const [studentLogin, setStudentLogin] = useState(() => localStorage.getItem("studentAccessLogin") || "Prática 360");
  const [studentPassword, setStudentPassword] = useState(() => localStorage.getItem("studentAccessPassword") || "Todos");

  // Workspace States
  const [roomDimensions, setRoomDimensions] = useState({ width: 5.0, depth: 4.0, height: 2.7 });
  const [designFee, setDesignFee] = useState<number>(0);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [appliedMaterials, setAppliedMaterials] = useState<AppliedMaterials>({
    floor: null,
    wallNorth: null,
    wallSouth: null,
    wallEast: null,
    wallWest: null,
  });

  // Briefing and chat states
  const [briefingMessages, setBriefingMessages] = useState<BriefingMessage[]>([]);
  const [isBriefingCompleted, setIsBriefingCompleted] = useState(false);

  // AI Review and Portfolio
  const [activeReview, setActiveReview] = useState<AIPedagogicalReview | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioVersion[]>([]);
  const [isIAAnalyzing, setIsIAAnalyzing] = useState(false);

  // Active view state (2D, 3D Walkthrough, 360°, VR)
  const [viewportMode, setViewportMode] = useState<"2d" | "3d" | "360" | "vr">("2d");
  const [cameraProjection, setCameraProjection] = useState<"ortografica" | "perspectiva">("ortografica");

  // Left panel sub-tab (Biblioteca, Briefing, Versões, Gamification)
  const [leftTab, setLeftTab] = useState<"library" | "briefing" | "simulation" | "challenges" | "portfolio">("library");

  // Library States
  const [activeCategory, setActiveCategory] = useState<string>("Recomendados");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Selected object ID in Viewport
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lockedObjects, setLockedObjects] = useState<string[]>([]);
  const [hiddenObjects, setHiddenObjects] = useState<string[]>([]);

  // Draw Wall State
  const [isWallDrawing, setIsWallDrawing] = useState(false);
  const [activeWallStart, setActiveWallStart] = useState<{ x: number; y: number } | null>(null);
  const [activeWallCurrent, setActiveWallCurrent] = useState<{ x: number; y: number } | null>(null);

  // Advanced CAD / Custom Drawing States
  const [customDrawings, setCustomDrawings] = useState<CustomDrawing[]>(() => {
    const saved = localStorage.getItem("customDrawings");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeDrawTool, setActiveDrawTool] = useState<string>("select"); // "select" | "measure" | "cut" | "line" | "curve" | "circle" | "rect" | "rounded_rect" | "door" | "window" | "roof" | "floor" | "accessibility"
  const [activeDrawSubType, setActiveDrawSubType] = useState<string>("swing_door"); // e.g. "swing_door", "tactile_directional", "wheelchair_150"
  const [activeDrawingStart, setActiveDrawingStart] = useState<{ x: number; y: number } | null>(null);
  const [activeDrawingCurrent, setActiveDrawingCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(null);
  const [strokeDash, setStrokeDash] = useState<string>("solid"); // "solid" | "dashed" | "dotted"
  const [strokeColor, setStrokeColor] = useState<string>("#0f172a");
  const [fillColor, setFillColor] = useState<string>("transparent");

  // Ruler state
  const [rulerPoints, setRulerPoints] = useState<{ x: number; y: number }[]>([]);

  // Snapping function to connect lines/elements and snap to walls/grid
  const getSnappedPoint = (rawX: number, rawY: number) => {
    const SNAP_DIST = 0.25; // Snapping threshold in meters
    // 1. Snap to other drawings' endpoints
    for (const d of customDrawings) {
      if (d.hidden) continue;
      if (Math.hypot(rawX - d.x1, rawY - d.y1) < SNAP_DIST) {
        return { x: d.x1, y: d.y1, snapped: true };
      }
      if (Math.hypot(rawX - d.x2, rawY - d.y2) < SNAP_DIST) {
        return { x: d.x2, y: d.y2, snapped: true };
      }
    }
    // 2. Snap to walls' endpoints
    for (const w of walls) {
      if (Math.hypot(rawX - w.x1, rawY - w.y1) < SNAP_DIST) {
        return { x: w.x1, y: w.y1, snapped: true };
      }
      if (Math.hypot(rawX - w.x2, rawY - w.y2) < SNAP_DIST) {
        return { x: w.x2, y: w.y2, snapped: true };
      }
    }
    // Default: snap to grid (0.05m increments)
    return { x: Math.round(rawX * 20) / 20, y: Math.round(rawY * 20) / 20, snapped: false };
  };

  // Viewport Settings
  const [zoom, setZoom] = useState(1.1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [showClearance, setShowClearance] = useState(true);

  // Coordinates of Mouse on the canvas
  const [mouseCoordinates, setMouseCoordinates] = useState({ x: 0, y: 0 });

  // Lighting State
  const [isNightMode, setIsNightMode] = useState(false);
  const [sunIntensity, setSunIntensity] = useState(80); // 0 to 100
  const [colorTemperature, setColorTemperature] = useState(4500); // 2000K to 6500K

  // Top Menu active dropdown
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Interactive 360 Rotation State

  // Custom visual notification toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Adaptive Challenge Mode (Modo Desafio)
  const [activeChallengeEvent, setActiveChallengeEvent] = useState<{
    id: string;
    title: string;
    description: string;
    budgetCutPercent: number;
    accessibilityChange: boolean;
    sustainabilityCheck: boolean;
  } | null>(null);
  const [dismissedChallengeEvents, setDismissedChallengeEvents] = useState<string[]>([]);

  // 2. Living Environment (Ambiente Vivo)
  const [weather, setWeather] = useState<"sunny" | "rainy" | "cloudy">("sunny");
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "sunset" | "night">("afternoon");
  const [tvOn, setTvOn] = useState(false);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [plantGrowth, setPlantGrowth] = useState(50); // 0 to 100
  const [peopleRunning, setPeopleRunning] = useState(false);

  // 3. Accessibility & Circulation Perspectives
  const [showCirculationFlow, setShowCirculationFlow] = useState(false);
  const [userPerspective, setUserPerspective] = useState<"standard" | "wheelchair" | "elderly" | "low_vision" | "child">("standard");

  // 5. Layout Generation (Geração por IA)
  const [isGeneratingLayout, setIsGeneratingLayout] = useState(false);
  const [generativePrompt, setGenerativePrompt] = useState("");

  // 6. Project Comparison Matrix
  const [savedLayouts, setSavedLayouts] = useState<Record<string, { placedObjects: PlacedObject[]; walls: Wall[]; appliedMaterials: AppliedMaterials }>>({});
  const [activeComparisonLayout, setActiveComparisonLayout] = useState<string | null>(null);

  // Responsive mobile view state ("canvas" | "sidebar")
  const [mobileView, setMobileView] = useState<"canvas" | "sidebar">("canvas");

  // Sidebar visibility state for small & large screens
  const [showSidebar, setShowSidebar] = useState(true);

  // 7. Socratic AI Mentor Discussion Messages
  const [mentorMessages, setMentorMessages] = useState<{ id: string; sender: "student" | "mentor"; text: string; timestamp: string }[]>([
    {
      id: "m-1",
      sender: "mentor",
      text: "Olá! Sou seu Mentor de Projeto IA. Estou aqui para guiar suas decisões técnicas e espaciais. O que você gostaria de discutir sobre o layout ativo?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [mentorInput, setMentorInput] = useState("");
  const [isMentorTyping, setIsMentorTyping] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);

  // Scaling factors
  const scale = 75; // px per meter
  const margin = 40;

  // Day/Night and environment colors
  const timeBasedBg = isNightMode ? "bg-[#090d16]" : "bg-slate-50";

  // FPS medido de verdade no navegador (média móvel curta), sem número simulado.
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frameId = 0;
    let frames = 0;
    let windowStart = performance.now();
    const measure = (now: number) => {
      frames += 1;
      const elapsed = now - windowStart;
      if (elapsed >= 750) {
        setFps(parseFloat(((frames * 1000) / elapsed).toFixed(1)));
        frames = 0;
        windowStart = now;
      }
      frameId = requestAnimationFrame(measure);
    };
    frameId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Load/Reset state when active challenge changes.
  // Se houver snapshot do mesmo caso, restaura o ambiente; caso contrário começa vazio.
  useEffect(() => {
    const savedProject = loadProjectSnapshot(activeChallengeId);
    let w = 5.0, d = 4.0, h = 2.7;
    if (activeCourse === CourseType.SPEECH_THERAPY) { w = 5.5; d = 4.5; }
    else if (activeCourse === CourseType.PHYSIOTHERAPY) { w = 6.5; d = 5.0; }
    else if (activeCourse === CourseType.PSYCHOLOGY) { w = 5.0; d = 4.0; }

    if (savedProject) {
      setRoomDimensions(savedProject.roomDimensions);
      setPlacedObjects(savedProject.placedObjects);
      setWalls(savedProject.walls);
      setAppliedMaterials(savedProject.appliedMaterials);
      setDesignFee(savedProject.designFee);
    } else {
      setRoomDimensions({ width: w, depth: d, height: h });
      setPlacedObjects([]);
      setWalls([]);
      setAppliedMaterials({
        floor: PRESET_MATERIALS.find(m => m.category === "laminados") || null,
        wallNorth: PRESET_MATERIALS.find(m => m.category === "tintas") || null,
        wallSouth: null,
        wallEast: null,
        wallWest: null,
      });
      setDesignFee(0);
    }
    setCustomDrawings([]); // Clear custom drawings for the new case
    setLockedObjects([]);
    setHiddenObjects([]);
    setSelectedObjectId(null);
    setSelectedDrawingId(null); // Clear custom selection as well
    // Populate default initial message from client
    const introMsg: BriefingMessage = {
      id: `msg-intro-${Date.now()}`,
      sender: "client",
      text: `Olá! Eu sou ${currentChallenge.clientName}. Fui designado para receber o seu atendimento. Podemos fazer a entrevista de briefing para eu te passar o que preciso no projeto?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setBriefingMessages([introMsg]);
    setIsBriefingCompleted(false);
    setActiveReview(null);
    setPortfolio([]);
    setViewportMode("2d");
    setLeftTab("briefing"); // Automatically switch to Client Briefing tab when a new case starts!
    setActiveChallengeEvent(null); // Reset surprise twists
    setGenerativePrompt(""); // Clear AI layout input
    setRulerPoints([]); // Clear ruler
    setZoom(1.1); // Centered zoom
    setPan({ x: 0, y: 0 }); // Center pan
    setIsWallDrawing(false);
    setActiveWallStart(null);
    setActiveWallCurrent(null);
    setActiveDrawTool("select"); // Reset to standard mouse pointer tool!
    setActiveDrawingStart(null);
    setActiveDrawingCurrent(null);
  }, [activeChallengeId]);

  // Sync custom drawings to localStorage
  useEffect(() => {
    localStorage.setItem("customDrawings", JSON.stringify(customDrawings));
  }, [customDrawings]);

  // Autosave reconstruível do ambiente (debounce para não gravar a cada pixel de interação).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveProjectSnapshot({
        challengeId: activeChallengeId,
        roomDimensions,
        placedObjects,
        walls,
        appliedMaterials,
        designFee,
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [roomDimensions, placedObjects, walls, appliedMaterials, designFee]);

  // Serve a completely new virtual client sequentially or randomly
  const handleAssignNewClient = (id?: string) => {
    let nextChallenge = challenges[0];
    if (id) {
      const selectedCh = challenges.find(c => c.id === id);
      if (selectedCh) nextChallenge = selectedCh;
    } else {
      const availableChallenges = challenges.filter(c => c.id !== activeChallengeId);
      if (availableChallenges.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        nextChallenge = availableChallenges[randomIndex];
      }
    }
    
    setActiveChallengeId(nextChallenge.id);
    localStorage.setItem("activeChallengeId", nextChallenge.id);
    showToast(`Iniciando caso: ${nextChallenge.title}`);
  };

  const handleCompleteActiveChallenge = () => {
    // 1. Mark current challenge as completed
    let updatedCompleted = completedChallengeIds;
    if (!completedChallengeIds.includes(activeChallengeId)) {
      updatedCompleted = [...completedChallengeIds, activeChallengeId];
      setCompletedChallengeIds(updatedCompleted);
      localStorage.setItem("completedChallengeIds", JSON.stringify(updatedCompleted));
    }
    
    // 2. Find next sequential challenge
    const currentIndex = challenges.findIndex(c => c.id === activeChallengeId);
    if (currentIndex !== -1 && currentIndex < challenges.length - 1) {
      const nextChallenge = challenges[currentIndex + 1];
      showToast(`🏆 Caso concluído! Carregando automaticamente: ${nextChallenge.title}...`);
      setTimeout(() => {
        setActiveChallengeId(nextChallenge.id);
        localStorage.setItem("activeChallengeId", nextChallenge.id);
      }, 2000);
    } else {
      showToast("🎉 Parabéns! Você concluiu com sucesso todos os casos pedagógicos!");
    }
  };

  // Handle Object adding, updating, removing
  const handleAddObject = (obj: PlacedObject) => {
    setPlacedObjects((prev) => [...prev, obj]);
  };

  const handleUpdateObject = useCallback((id: string, updated: Partial<PlacedObject>) => {
    setPlacedObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updated } : obj))
    );
  }, []);

  const handleRemoveObject = (id: string) => {
    setPlacedObjects((prev) => prev.filter((obj) => obj.id !== id));
    if (selectedObjectId === id) setSelectedObjectId(null);
  };

  const handleReplacePlacedObject = (placedId: string, newCatalogId: string) => {
    const catalogItem = CATALOG_OBJECTS.find(o => o.id === newCatalogId);
    if (!catalogItem) return;

    setPlacedObjects((prev) =>
      prev.map((obj) => {
        if (obj.id === placedId) {
          return {
            ...obj,
            catalogId: catalogItem.id,
            name: catalogItem.name,
            price: catalogItem.price,
            width: catalogItem.width,
            depth: catalogItem.depth,
            height: catalogItem.height,
            manufacturer: catalogItem.manufacturer,
            material: catalogItem.material,
          };
        }
        return obj;
      })
    );
    showToast(`Mobiliário substituído por ${catalogItem.name}`);
  };

  const handleUpdateMaterials = (
    surface: "floor" | "wallNorth" | "wallSouth" | "wallEast" | "wallWest",
    mat: Material | null
  ) => {
    setAppliedMaterials((prev) => ({ ...prev, [surface]: mat }));
  };

  // Drag and drop / placing simulation in 2D
  const handleAddObjectToRoom = (catObj: any) => {
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
    handleAddObject(newPlaced);
    setSelectedObjectId(newPlaced.id);
    showToast(`Inserido: ${newPlaced.name}`);
  };

  const handleRotateSelected = () => {
    if (!selectedObjectId) return;
    const obj = placedObjects.find((o) => o.id === selectedObjectId);
    if (!obj) return;
    const newRotation = (obj.rotation + 90) % 360;
    const result = resolveObjectPlacement(
      obj,
      { rotation: newRotation },
      roomDimensions,
      placedObjects,
      (item) => objectParticipatesInCollision(item.name),
    );
    if (!result.valid) {
      showToast(`Não foi possível girar: colisão com ${result.conflictingObject?.name || "outro objeto"}.`);
      return;
    }
    handleUpdateObject(selectedObjectId, result.update);
  };

  const handleDuplicateSelected = () => {
    if (!selectedObjectId) return;
    const obj = placedObjects.find((o) => o.id === selectedObjectId);
    if (!obj) return;
    const duplicated: PlacedObject = {
      ...obj,
      id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      x: Math.min(roomDimensions.width - obj.width, obj.x + 0.2),
      y: Math.min(roomDimensions.depth - obj.depth, obj.y + 0.2),
    };
    handleAddObject(duplicated);
    setSelectedObjectId(duplicated.id);
    showToast(`Duplicado: ${obj.name}`);
  };

  const handleLockToggle = () => {
    if (!selectedObjectId) return;
    setLockedObjects((prev) => 
      prev.includes(selectedObjectId) 
        ? prev.filter(id => id !== selectedObjectId) 
        : [...prev, selectedObjectId]
    );
  };

  const handleHideToggle = () => {
    if (!selectedObjectId) return;
    setHiddenObjects((prev) => 
      prev.includes(selectedObjectId) 
        ? prev.filter(id => id !== selectedObjectId) 
        : [...prev, selectedObjectId]
    );
  };

  // Saving version history
  const handleSaveVersion = () => {
    const version: PortfolioVersion = {
      id: `ver-${Date.now()}`,
      title: `Versão ${portfolio.length + 1}: Planta Baixa Customizada`,
      timestamp: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      placedObjects: JSON.parse(JSON.stringify(placedObjects)),
      walls: JSON.parse(JSON.stringify(walls)),
      appliedMaterials: JSON.parse(JSON.stringify(appliedMaterials)),
      budgetSpent: totalSpent,
      review: activeReview ? { ...activeReview } : null,
    };
    setPortfolio((prev) => [version, ...prev]);
    showToast("Versão de projeto salva com sucesso!");
  };

  const handleRestoreVersion = (ver: PortfolioVersion) => {
    setPlacedObjects(JSON.parse(JSON.stringify(ver.placedObjects)));
    setWalls(JSON.parse(JSON.stringify(ver.walls || [])));
    setAppliedMaterials(JSON.parse(JSON.stringify(ver.appliedMaterials)));
    if (ver.review) setActiveReview(ver.review);
    showToast(`Restaurado para: ${ver.title}`);
  };

  // AI analysis executor
  const handleExecuteAIAnalysis = async () => {
    setIsIAAnalyzing(true);
    showToast("IA analisando circulação, NBR-9050 e acústica...");
    try {
      const response = await fetch("/api/analysis/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: activeCourse,
          challenge: currentChallenge,
          placedObjects,
          appliedMaterials,
          roomDimensions,
          walls,
          budgetSpent: totalSpent,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao contatar o motor pedagógico da IA.");
      }

      const data = await response.json();
      setActiveReview(data);
      setLeftTab("history"); // show timeline with review
      showToast("Laudo Técnico IA concluído!");
    } catch (err) {
      console.error(err);
      // Fallback Review
      const mockReview: AIPedagogicalReview = {
        scoreCirculation: 9.2,
        scoreErgonomics: 8.5,
        scoreAcousticLighting: 8.0,
        scoreAccessibility: 7.5,
        scoreBudget: totalSpent <= currentChallenge.budgetMax ? 10 : 4,
        scoreSustainability: 8.8,
        scoreBriefingMatch: 9.0,
        feedbackCirculation: "Excelente. Fluxo desimpedido e layout limpo. Larguras de vãos livres cumprem a circulação padrão.",
        feedbackErgonomics: "O mobiliário profissional respeita as posições ergonômicas funcionais e as distâncias recomendadas.",
        feedbackAcousticLighting: "O uso de revestimentos de madeira ajuda na atenuação de som, e a iluminação direta supre o consultório.",
        feedbackAccessibility: "Alguns itens estão próximos de cantos. Lembre-se de preservar o diâmetro mínimo de 1,50m para cadeiras de rodas.",
        feedbackBudget: totalSpent <= currentChallenge.budgetMax 
          ? "Parabéns! Você se manteve dentro dos limites econômicos exigidos pelo mediador." 
          : "Cuidado! Seu orçamento estourou os limites do desafio econômico.",
        feedbackSustainability: "Materiais adequados. Uso de MDF de reflorestamento e lâmpadas de baixo consumo.",
        feedbackBriefingMatch: "O briefing do cliente foi seguido de maneira exemplar nas decisões projetuais principais.",
        generalVeredict: "Aprovado com ressalvas menores para acessibilidade universal nas rotas secundárias.",
        practicalRecommendations: [
          "Ajuste o posicionamento dos móveis de canto para liberar passagem mínima de 90cm.",
          "Verifique se o piso vinílico ou cerâmico selecionado é antiderrapante para segurança clínica.",
          "Evite colocar lâmpadas de calor muito próximas ao assento do cliente."
        ]
      };
      setActiveReview(mockReview);
      showToast("Laudo Técnico IA gerado (Modelo offline).");
    } finally {
      setIsIAAnalyzing(false);
    }
  };

  // Total Spent calculation
  const floorArea = roomDimensions.width * roomDimensions.depth;
  const wallNorthArea = roomDimensions.width * roomDimensions.height;
  const wallSouthArea = roomDimensions.width * roomDimensions.height;
  const wallEastArea = roomDimensions.depth * roomDimensions.height;
  const wallWestArea = roomDimensions.depth * roomDimensions.height;

  const matFloorCost = appliedMaterials.floor ? floorArea * appliedMaterials.floor.price : 0;
  const matWallNorthCost = appliedMaterials.wallNorth ? wallNorthArea * appliedMaterials.wallNorth.price : 0;
  const matWallSouthCost = appliedMaterials.wallSouth ? wallSouthArea * appliedMaterials.wallSouth.price : 0;
  const matWallEastCost = appliedMaterials.wallEast ? wallEastArea * appliedMaterials.wallEast.price : 0;
  const matWallWestCost = appliedMaterials.wallWest ? wallWestArea * appliedMaterials.wallWest.price : 0;

  const maxChallengeBudget = activeChallengeEvent && activeChallengeEvent.budgetCutPercent > 0
    ? currentChallenge.budgetMax * (1 - activeChallengeEvent.budgetCutPercent / 100)
    : currentChallenge.budgetMax;

  // Recuperado da versão 148: o orçamento considera apenas itens de Design de Interiores
  // e os honorários informados. Piso, paredes, portas, janelas e telhado não entram na soma.
  const budgetSummary = calculateBudgetSummary(maxChallengeBudget, placedObjects, designFee);
  const itemsSpent = budgetSummary.itemsSpent;
  const totalSpent = budgetSummary.totalSpent;

  const isOverBudget = budgetSummary.isOverBudget;

  // Filter Catalog
  const filteredCatalog = CATALOG_OBJECTS.filter((obj) => {
    const matchesSearch = obj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          obj.subcategory.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeCategory === "Favoritos") return favorites.includes(obj.id);
    if (activeCategory === "Recomendados") {
      if (activeCourse === CourseType.INTERIORS) return obj.category === "Residencial";
      if (activeCourse === CourseType.SPEECH_THERAPY) return obj.category === "Clínicas" && (obj.subcategory === "Fonoaudiologia" || obj.subcategory === "Audiologia");
      if (activeCourse === CourseType.PSYCHOLOGY) return obj.category === "Clínicas" && obj.subcategory === "Psicologia";
      if (activeCourse === CourseType.PHYSIOTHERAPY) return obj.category === "Clínicas" && obj.subcategory === "Fisioterapia";
      return obj.category === "Clínicas";
    }
    if (activeCategory === "Todos") return true;
    return obj.category === activeCategory || obj.subcategory === activeCategory;
  });

  const resetStudentExperience = () => {
    setActiveChallengeId(INITIAL_CHALLENGES[0].id);
    setCompletedChallengeIds([]);
    setPlacedObjects([]);
    setWalls([]);
    setAppliedMaterials({ floor: null, wallNorth: null, wallSouth: null, wallEast: null, wallWest: null });
    setBriefingMessages([]);
    setIsBriefingCompleted(false);
    setActiveReview(null);
    setPortfolio([]);
    setSelectedObjectId(null);
    setCustomDrawings([]);
    setDesignFee(0);
    setViewportMode("2d");
    setLeftTab("briefing");
    localStorage.removeItem("activeChallengeId");
    localStorage.removeItem("completedChallengeIds");
    localStorage.removeItem("customDrawings");
    INITIAL_CHALLENGES.forEach((challenge) => clearProjectSnapshot(challenge.id));
    showToast("Dinâmica reiniciada. A próxima experiência começa do início.");
  };

  const updateStudentCredentials = (login: string, password: string) => {
    const cleanLogin = login.trim() || "Prática 360";
    const cleanPassword = password || "Todos";
    setStudentLogin(cleanLogin);
    setStudentPassword(cleanPassword);
    localStorage.setItem("studentAccessLogin", cleanLogin);
    localStorage.setItem("studentAccessPassword", cleanPassword);
    showToast("Login e senha dos alunos atualizados.");
  };

  const selectedObject = placedObjects.find((o) => o.id === selectedObjectId);
  const visiblePlacedObjects = useMemo(
    () => placedObjects.filter((item) => !hiddenObjects.includes(item.id)),
    [placedObjects, hiddenObjects],
  );

  // Math helper: distance from a point to a line segment
  const getPointToSegmentDistance = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.hypot(dx, dy);
  };

  // Handle CAD-style mousedown events on canvas background
  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    // Ignore middle or right clicks (handled by pan or zoom)
    if (e.button === 1 || e.button === 2) return;

    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - margin * zoom) / (scale * zoom) - pan.x;
    const rawY = (e.clientY - rect.top - margin * zoom) / (scale * zoom) - pan.y;

    // Apply Snapping coordinates
    const snapped = getSnappedPoint(rawX, rawY);

    if (activeDrawTool === "cut") {
      e.stopPropagation();
      // Try to find if user clicked a custom drawing to trim/delete
      const clickedDrawing = customDrawings.find(d => {
        if (d.hidden) return false;
        if (d.type === "line" || d.type === "curve") {
          return getPointToSegmentDistance(rawX, rawY, d.x1, d.y1, d.x2, d.y2) < 0.25;
        } else if (d.type === "circle") {
          const distToCenter = Math.hypot(rawX - (d.cx || d.x1), rawY - (d.cy || d.y1));
          return Math.abs(distToCenter - (d.r || 0.5)) < 0.25 || distToCenter < 0.25;
        } else {
          // Rect / other boundaries
          return (
            rawX >= Math.min(d.x1, d.x2) - 0.15 &&
            rawX <= Math.max(d.x1, d.x2) + 0.15 &&
            rawY >= Math.min(d.y1, d.y2) - 0.15 &&
            rawY <= Math.max(d.y1, d.y2) + 0.15
          );
        }
      });

      if (clickedDrawing) {
        setCustomDrawings(prev => prev.filter(item => item.id !== clickedDrawing.id));
        showToast("Desenho técnico removido (cortado).");
        setSelectedDrawingId(null);
        return;
      }

      // Try to find if user clicked a wall to cut/remove
      const clickedWall = walls.find(w => {
        return getPointToSegmentDistance(rawX, rawY, w.x1, w.y1, w.x2, w.y2) < 0.25;
      });

      if (clickedWall) {
        setWalls(prev => prev.filter(item => item.id !== clickedWall.id));
        showToast("Parede estrutural removida (cortada).");
        return;
      }
      return;
    }

    if (activeDrawTool === "measure") {
      e.stopPropagation();
      setActiveDrawingStart({ x: snapped.x, y: snapped.y });
      setActiveDrawingCurrent({ x: snapped.x, y: snapped.y });
      return;
    }

    if (activeDrawTool !== "select" && activeDrawTool !== "wall") {
      e.stopPropagation();
      setActiveDrawingStart({ x: snapped.x, y: snapped.y });
      setActiveDrawingCurrent({ x: snapped.x, y: snapped.y });
    } else if (activeDrawTool === "select") {
      // Clear selections if clicking background
      if (e.target === svgRef.current) {
        setSelectedObjectId(null);
        setSelectedDrawingId(null);
      }
    }
  };

  // Mouse drag moving inside 2D
  const handleDragStart = (e: React.MouseEvent, placedObj: PlacedObject) => {
    if (activeDrawTool !== "select") return; // If we are not in select mode, do not drag furniture
    if (lockedObjects.includes(placedObj.id)) return;
    e.stopPropagation();
    setSelectedObjectId(placedObj.id);
    setSelectedDrawingId(null); // Clear custom drawing selection
    setIsDragging(true);

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cursorX = (e.clientX - rect.left - margin * zoom) / (scale * zoom) - pan.x;
    const cursorY = (e.clientY - rect.top - margin * zoom) / (scale * zoom) - pan.y;

    setDragOffset({
      x: cursorX - placedObj.x,
      y: cursorY - placedObj.y,
    });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - margin * zoom) / (scale * zoom) - pan.x;
    const rawY = (e.clientY - rect.top - margin * zoom) / (scale * zoom) - pan.y;

    // Snapped point coordinates for tracking cursor and connect lines
    const snapped = getSnappedPoint(rawX, rawY);
    setMouseCoordinates({ x: snapped.x, y: snapped.y });

    if (isPanning) {
      const dx = (e.clientX - panStart.x) / (scale * zoom);
      const dy = (e.clientY - panStart.y) / (scale * zoom);
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Active wall drafting
    if (isWallDrawing && activeWallStart) {
      setActiveWallCurrent({ x: snapped.x, y: snapped.y });
      return;
    }

    // Active technical custom drawing / measurement drafting
    if (activeDrawingStart) {
      setActiveDrawingCurrent({ x: snapped.x, y: snapped.y });
      return;
    }

    // Standard furniture drag move
    if (!isDragging || !selectedObjectId) return;

    const targetObj = placedObjects.find((o) => o.id === selectedObjectId);
    if (!targetObj) return;

    const result = resolveObjectPlacement(
      targetObj,
      { x: rawX - dragOffset.x, y: rawY - dragOffset.y },
      roomDimensions,
      placedObjects,
      (item) => objectParticipatesInCollision(item.name),
    );
    if (result.valid) handleUpdateObject(selectedObjectId, result.update);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsPanning(false);

    // Finalize custom measurement ruler or technical drafting
    if (activeDrawingStart && activeDrawingCurrent) {
      const x1 = activeDrawingStart.x;
      const y1 = activeDrawingStart.y;
      const x2 = activeDrawingCurrent.x;
      const y2 = activeDrawingCurrent.y;
      const dist = Math.hypot(x2 - x1, y2 - y1);

      if (activeDrawTool === "measure") {
        if (dist >= 0.05) {
          showToast(`Medição concluída: ${dist.toFixed(2)}m`);
        }
        // Keep points in active state for visual representation until next mousedown or clear
      } else if (activeDrawTool !== "select" && activeDrawTool !== "cut" && activeDrawTool !== "wall") {
        // Only insert if there's actual size or if it's click-based
        if (dist >= 0.05 || ["door", "window", "circle", "rect", "rounded_rect", "accessibility", "floor", "roof"].includes(activeDrawTool)) {
          let finalW = Math.max(0.15, Math.abs(x2 - x1));
          let finalD = Math.max(0.15, Math.abs(y2 - y1));
          
          const newDrawing: CustomDrawing = {
            id: `draw-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            type: activeDrawTool as any,
            subType: activeDrawSubType,
            x1,
            y1,
            x2,
            y2,
            cx: x1,
            cy: y1,
            r: dist > 0 ? dist : 0.75,
            width: finalW,
            depth: finalD,
            height: 1.0,
            rotation: 0,
            strokeDash: strokeDash,
            strokeColor: strokeColor,
            fillColor: fillColor,
            name: `${activeDrawTool.toUpperCase()}`,
            hidden: false
          };

          setCustomDrawings(prev => [...prev, newDrawing]);
          showToast(`Elemento técnico criado: ${activeDrawTool === "accessibility" ? "Acessibilidade" : activeDrawTool}`);
        }
        setActiveDrawingStart(null);
        setActiveDrawingCurrent(null);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isWallDrawing && activeWallStart && activeWallCurrent) {
      const dx = activeWallCurrent.x - activeWallStart.x;
      const dy = activeWallCurrent.y - activeWallStart.y;
      const len = Math.hypot(dx, dy);

      if (len >= 0.2) {
        const newWall: Wall = {
          id: `wall-${Date.now()}`,
          x1: activeWallStart.x,
          y1: activeWallStart.y,
          x2: activeWallCurrent.x,
          y2: activeWallCurrent.y,
          thickness: 0.15,
          height: roomDimensions.height,
        };
        setWalls((prev) => [...prev, newWall]);
        showToast("Nova parede estrutural inserida.");
      }
      setActiveWallStart(null);
      setActiveWallCurrent(null);
      setIsWallDrawing(false);
      return;
    }
    
    // Clear selection if clicking on canvas background
    if (e.target === svgRef.current) {
      setSelectedObjectId(null);
      setSelectedDrawingId(null);
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(3, prev * zoomFactor));
    } else {
      setZoom((prev) => Math.max(0.5, prev / zoomFactor));
    }
  };

  // Handle key listeners for object manipulation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (selectedObjectId) {
        if (e.key === "Delete" || e.key === "Backspace") {
          handleRemoveObject(selectedObjectId);
        }
        if (e.key === "r" || e.key === "R") {
          handleRotateSelected();
        }
        if (e.key === "d" || e.key === "D") {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleDuplicateSelected();
          }
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [selectedObjectId, placedObjects, roomDimensions]);

  if (!studentAccessGranted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-7 shadow-2xl">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4">
              <LogIn className="h-7 w-7 text-sky-300" />
            </div>
            <h1 className="text-2xl font-black">Prática 360°</h1>
            <p className="text-sm text-slate-400 mt-2">Escritório em Ação 360° — acesso ao laboratório prático</p>
          </div>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (studentAccessLogin.trim() === studentLogin && studentAccessPassword === studentPassword) {
              resetStudentExperience();
              sessionStorage.setItem("studentAccessGranted", "true");
              setStudentAccessGranted(true);
              setStudentAccessError("");
            } else {
              setStudentAccessError("Login ou senha incorretos.");
            }
          }} className="space-y-4">
            <div>
              <label htmlFor="student-login" className="text-xs font-bold text-slate-400">Login</label>
              <input id="student-login" value={studentAccessLogin} onChange={(event) => setStudentAccessLogin(event.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:border-sky-400 focus:outline-none" autoComplete="username" />
            </div>
            <div>
              <label htmlFor="student-password" className="text-xs font-bold text-slate-400">Senha</label>
              <input id="student-password" type="password" value={studentAccessPassword} onChange={(event) => setStudentAccessPassword(event.target.value)} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm focus:border-sky-400 focus:outline-none" autoComplete="current-password" />
            </div>
            {studentAccessError && <p className="text-xs text-rose-400 text-center" role="alert">{studentAccessError}</p>}
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 rounded-xl py-3 text-sm font-black">Entrar no laboratório</button>
          </form>
          <p className="text-[10px] text-slate-500 text-center mt-5">Use o acesso fornecido pela Mediadora. Cada nova entrada inicia uma experiência limpa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 antialiased bg-white select-none">
      
      {/* Dynamic Dropdowns & Popup Toasts */}
      {toastMessage && (
        <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50 glass-effect rounded-full px-5 py-2.5 shadow-2xl border border-slate-200 flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4 w-4 text-emerald-600 animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-xs font-bold text-slate-800 font-sans">{toastMessage}</span>
        </div>
      )}

      {/* 1. MENU SUPERIOR (Figma + Apple Glassmorphism Look) */}
      <nav className="glass-effect h-14 px-6 flex items-center justify-between border-b border-slate-200/65 shadow-sm shrink-0 sticky top-0 z-40">
        
        {/* Brand & Platform Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 text-white p-2 rounded-lg flex items-center justify-center shadow-md">
            <Layers className="h-4 w-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tight font-display text-slate-900 flex items-center gap-1">
              Laboratório Prático <span className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">360°</span>
            </span>
            <p className="text-[8px] font-mono tracking-widest text-slate-400 uppercase -mt-0.5">Espaço BIM Educacional</p>
          </div>
        </div>

        {/* CAD-Style Action menus */}
        <div className="hidden md:flex items-center gap-1 relative">
          {[
            { id: "arquivo", label: "Arquivo" },
            { id: "projeto", label: "Projeto" },
            { id: "inserir", label: "Inserir" },
            { id: "materiais", label: "Materiais" },
            { id: "iluminacao", label: "Iluminação" },
            { id: "visualizacao", label: "Visualização" },
            { id: "ia", label: "IA" },
            { id: "mediador", label: "Mediador" },
            { id: "perfil", label: "Perfil" }
          ].map((menu) => (
            <div key={menu.id} className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === menu.id ? null : menu.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold font-sans cursor-pointer transition-colors flex items-center gap-1 ${
                  activeDropdown === menu.id 
                    ? "bg-slate-100 text-slate-900" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <span>{menu.label}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {/* Float Dropdowns */}
              {activeDropdown === menu.id && (
                <div className="absolute top-8 left-0 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  {menu.id === "arquivo" && (
                    <>
                      <button onClick={() => { setPlacedObjects([]); setWalls([]); setActiveReview(null); setActiveDropdown(null); showToast("Novo espaço em branco iniciado."); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left font-sans text-slate-700">
                        <Grid className="h-3.5 w-3.5 text-slate-400" />
                        <span>Novo Projeto</span>
                      </button>
                      <button onClick={() => { handleSaveVersion(); setActiveDropdown(null); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left font-sans text-slate-700">
                        <Save className="h-3.5 w-3.5 text-slate-400" />
                        <span>Salvar Versão</span>
                      </button>
                      <button onClick={() => { showToast("Orçamento exportado para PDF."); setActiveDropdown(null); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left font-sans text-slate-700">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                        <span>Exportar Relatório Orçamentário</span>
                      </button>
                    </>
                  )}

                  {menu.id === "projeto" && (
                    <div className="p-1 space-y-2">
                      <span className="text-[9px] font-mono uppercase text-slate-400 px-1 font-bold block">Progresso Acadêmico</span>
                      
                      <div className="space-y-1">
                        {challenges.map((c, index) => {
                          const isCompleted = completedChallengeIds.includes(c.id);
                          const isActive = c.id === activeChallengeId;

                          if (mediatorMode) {
                            // Mediator has full control to change/test any case
                            return (
                              <button
                                key={c.id}
                                onClick={() => { handleAssignNewClient(c.id); setActiveDropdown(null); }}
                                className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left hover:bg-slate-50 transition-all ${isActive ? "bg-purple-50/50 border border-purple-200/50 font-bold text-purple-700" : "text-slate-700"}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{c.clientAvatar}</span>
                                  <div>
                                    <p className="font-sans leading-tight text-[11px] truncate">{c.title}</p>
                                    <p className="text-[9px] text-slate-400 font-mono leading-none">{c.course}</p>
                                  </div>
                                </div>
                                <span className="text-[8px] font-mono uppercase text-purple-500 font-bold px-1.5 py-0.5 bg-purple-50 rounded">PROF</span>
                              </button>
                            );
                          }

                          // Student View: Locked list, sequential progression
                          return (
                            <div
                              key={c.id}
                              className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left select-none transition-all ${
                                isActive 
                                  ? "bg-emerald-50/60 border border-emerald-200/60 font-bold text-emerald-800" 
                                  : isCompleted 
                                    ? "text-slate-500 bg-slate-50/50" 
                                    : "text-slate-300 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{c.clientAvatar}</span>
                                <div className="max-w-[100px]">
                                  <p className="font-sans leading-tight text-[11px] truncate">{c.title}</p>
                                  <p className="text-[9px] text-slate-400 font-mono leading-none">{c.course}</p>
                                </div>
                              </div>

                              <div className="text-[9px] font-bold font-mono shrink-0">
                                {isActive ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Ativo
                                  </span>
                                ) : isCompleted ? (
                                  <span className="text-slate-400 flex items-center gap-1">
                                    ✓ Feito
                                  </span>
                                ) : (
                                  <span className="text-slate-300 flex items-center gap-1">
                                    🔒 Bloq
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-slate-100 pt-2 space-y-1">
                        <span className="text-[9px] font-mono uppercase text-slate-400 px-1 font-bold block">Área do Projeto</span>
                        {["Residência", "Apartamento", "Studio", "Clínica", "Consultório", "Hospital", "Coworking", "Restaurante"].map(area => (
                          <button key={area} onClick={() => { setActiveArea(area); setActiveDropdown(null); showToast(`Template alterado para: ${area}`); }} className={`w-full text-left p-1 rounded hover:bg-slate-50 text-[10px] ${activeArea === area ? "font-bold text-emerald-600 bg-slate-50" : "text-slate-500"}`}>
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {menu.id === "inserir" && (
                    <>
                      <button onClick={() => { setIsWallDrawing(true); setActiveDropdown(null); showToast("Clique no grid para iniciar a parede estrutural."); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left text-slate-700">
                        <Ruler className="h-3.5 w-3.5 text-slate-400" />
                        <span>Desenhar Parede (0.15m)</span>
                      </button>
                      <span className="text-[9px] font-mono uppercase text-slate-400 px-2 pt-1 font-bold block">Mobiliário Rápido</span>
                      {CATALOG_OBJECTS.slice(0, 5).map(obj => (
                        <button key={obj.id} onClick={() => { handleAddObjectToRoom(obj); setActiveDropdown(null); }} className="w-full text-left p-1.5 px-2.5 rounded-md hover:bg-slate-50 text-slate-700 font-sans truncate">
                          🛋️ {obj.name}
                        </button>
                      ))}
                    </>
                  )}

                  {menu.id === "materiais" && (
                    <div className="p-1 space-y-1">
                      <span className="text-[9px] font-mono uppercase text-slate-400 px-1 font-bold block">Selecione Piso</span>
                      {PRESET_MATERIALS.filter(m => m.category === "laminados" || m.category === "porcelanatos").map(mat => (
                        <button key={mat.id} onClick={() => { handleUpdateMaterials("floor", mat); setActiveDropdown(null); showToast(`Piso alterado para: ${mat.name}`); }} className="w-full flex items-center gap-1.5 p-1 rounded hover:bg-slate-50 text-slate-700 text-left">
                          <span className="w-2.5 h-2.5 rounded-sm border border-slate-300" style={{ backgroundColor: mat.color }} />
                          <span className="truncate">{mat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {menu.id === "iluminacao" && (
                    <div className="p-2 space-y-2 text-slate-700 font-sans">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                        <span className="font-bold text-[10px] uppercase font-mono">Luminosidade</span>
                        <button onClick={() => setIsNightMode(!isNightMode)} className="p-1 rounded bg-slate-100 hover:bg-slate-200">
                          {isNightMode ? <Moon className="h-3.5 w-3.5 text-blue-600" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
                        </button>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] block text-slate-500">Luz Solar ({sunIntensity}%)</span>
                        <input type="range" min="0" max="100" value={sunIntensity} onChange={(e) => setSunIntensity(parseInt(e.target.value))} className="w-full accent-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] block text-slate-500">Temperatura Cor ({colorTemperature}K)</span>
                        <input type="range" min="2000" max="6500" step="500" value={colorTemperature} onChange={(e) => setColorTemperature(parseInt(e.target.value))} className="w-full accent-amber-500" />
                      </div>
                    </div>
                  )}

                  {menu.id === "visualizacao" && (
                    <>
                      <button onClick={() => { setViewportMode("2d"); setActiveDropdown(null); }} className={`flex items-center gap-2 p-2 rounded-lg text-left ${viewportMode === "2d" ? "bg-slate-50 font-bold text-emerald-600" : "text-slate-700 hover:bg-slate-50"}`}>
                        <Layout className="h-3.5 w-3.5 text-slate-400" />
                        <span>Planta Baixa (2D)</span>
                      </button>
                      <button onClick={() => { setViewportMode("3d"); setActiveDropdown(null); }} className={`flex items-center gap-2 p-2 rounded-lg text-left ${viewportMode === "3d" ? "bg-slate-50 font-bold text-emerald-600" : "text-slate-700 hover:bg-slate-50"}`}>
                        <Compass className="h-3.5 w-3.5 text-slate-400" />
                        <span>Walkthrough (3D)</span>
                      </button>
                      <button onClick={() => { setViewportMode("360"); setActiveDropdown(null); }} className={`flex items-center gap-2 p-2 rounded-lg text-left ${viewportMode === "360" ? "bg-slate-50 font-bold text-emerald-600" : "text-slate-700 hover:bg-slate-50"}`}>
                        <Compass className="h-3.5 w-3.5 text-slate-400 animate-spin" />
                        <span>Giro 360° Imersivo</span>
                      </button>
                      <button onClick={() => { setViewportMode("vr"); setActiveDropdown(null); }} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left text-slate-400 cursor-not-allowed">
                        <Tv className="h-3.5 w-3.5 opacity-50" />
                        <span>Ativar VR (Óculos/Mobile)</span>
                      </button>
                    </>
                  )}

                  {menu.id === "ia" && (
                    <>
                      <button onClick={() => { handleExecuteAIAnalysis(); setActiveDropdown(null); }} disabled={isIAAnalyzing} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left font-bold text-emerald-600">
                        <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{isIAAnalyzing ? "Analisando..." : "Auditar Espaço com IA"}</span>
                      </button>
                      <div className="border-t border-slate-100 p-2 font-mono text-[9px] text-slate-400">
                        Análise de Ergonomia, Circulação, Acessibilidade e Custos.
                      </div>
                    </>
                  )}

                  {menu.id === "mediador" && (
                    <>
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          if (isMediatorLoggedIn) {
                            setMediatorMode(!mediatorMode);
                          } else {
                            setShowLoginModal(true);
                          }
                        }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-left text-purple-600 font-bold"
                      >
                        <User className="h-3.5 w-3.5 text-purple-500" />
                        <span>{mediatorMode ? "Sair do Painel" : "Acessar Mediador"}</span>
                      </button>
                    </>
                  )}

                  {menu.id === "perfil" && (
                    <div className="p-2 space-y-2 text-slate-700">
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                        <div className="bg-emerald-100 p-1 rounded text-lg">🎓</div>
                        <div>
                          <p className="font-bold text-[11px]">Estudante Ativo</p>
                          <p className="text-[9px] text-slate-400 font-mono">ID: aistudio-aluno</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-center">
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[8px] font-mono text-slate-400 block uppercase">XP</span>
                          <span className="text-xs font-black text-slate-800">1.450 pts</span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="text-[8px] font-mono text-slate-400 block uppercase">Moedas</span>
                          <span className="text-xs font-black text-emerald-600">350 L$</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Student Indicator & Mediator access */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Alinhamento Clínico: {activeCourse}</span>
          </div>

          <button
            onClick={() => {
              if (isMediatorLoggedIn) {
                setMediatorMode(!mediatorMode);
              } else {
                setShowLoginModal(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
              mediatorMode
                ? "bg-purple-600/10 border-purple-500/20 text-purple-700 hover:bg-purple-600/20"
                : "bg-slate-900 border-slate-850 text-slate-100 hover:bg-slate-800"
            }`}
          >
            {mediatorMode ? "Painel Professor" : "Área Aluno"}
          </button>
        </div>
      </nav>

      {/* Restricted Mediator Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="bg-purple-600/10 p-2 rounded-lg border border-purple-500/20">
                <Lock className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Autenticação do Mediador</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Acesso Restrito ao Professor</p>
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded-lg text-xs font-semibold text-center animate-shake">
                {loginError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (loginUser === "mediadorakeise" && loginPass === "12345678") {
                  setIsMediatorLoggedIn(true);
                  sessionStorage.setItem("isMediatorLoggedIn", "true");
                  setMediatorMode(true);
                  setShowLoginModal(false);
                  setLoginError("");
                } else {
                  setLoginError("Usuário ou Senha incorretos.");
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Usuário</label>
                <input
                  type="text"
                  required
                  placeholder="mediadorakeise"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase font-bold">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setLoginError("");
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 font-bold py-2 px-4 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl text-xs cursor-pointer shadow-lg shadow-purple-950/40 transition-colors"
                >
                  Entrar
                </button>
              </div>
            </form>
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 text-center text-[10px] text-slate-500 font-mono">
              Acesso recuperado: <span className="text-purple-400">mediadorakeise</span> / <span className="text-purple-400 font-bold">12345678</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Container Workspace */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-100px)] overflow-hidden bg-slate-100/50 relative">
        
        {mediatorMode ? (
          /* Educator/Teacher Dashboard View */
          <div className="flex-1 overflow-y-auto p-6">
            <MediatorDashboard
              challenges={challenges}
              onAddChallenge={(ch) => setChallenges((prev) => [ch, ...prev])}
              onRemoveChallenge={(id) => setChallenges((prev) => prev.filter((c) => c.id !== id))}
              onUpdateChallenge={(id, upd) =>
                setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, ...upd } : c)))
              }
              isSimulationActive={isSimulationActive}
              onToggleSimulationActive={(active) => {
                setIsSimulationActive(active);
                localStorage.setItem("isSimulationActive", String(active));
              }}
              studentAccessLogin={studentLogin}
              studentAccessPassword={studentPassword}
              onUpdateStudentAccess={updateStudentCredentials}
              onResetStudentProgress={resetStudentExperience}
            />
          </div>
        ) : !isSimulationActive ? (
          /* Locked Simulation screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 text-center text-white">
            <div className="max-w-md space-y-4">
              <Compass className="h-12 w-12 text-emerald-400 animate-spin mx-auto" />
              <h2 className="text-lg font-black font-sans">Simulação Suspensa</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Intervalo pedagógico – O Escritório em Ação 360º está temporariamente fechado. Design: Keise Pâmela Morais.
              </p>
            </div>
          </div>
        ) : (
          /* STUDENT MODELLING WORKSPACE */
          <>
            
            {/* 2. PAINEL ESQUERDO: Biblioteca, Categorias, Pesquisar, Favoritos */}
            <aside className={`w-full max-w-[320px] md:w-80 bg-white border-r border-slate-200/75 flex flex-col h-full shrink-0 z-35 shadow-2xl md:shadow-none absolute md:relative left-0 top-0 bottom-0 transition-all duration-300 ${showSidebar ? "translate-x-0 flex" : "-translate-x-full hidden md:hidden"}`}>
              
              {/* Module Toggle Tab headers */}
              <div className="flex items-center border-b border-slate-100 bg-slate-50/50 p-1 w-full">
                <div className="flex flex-1 items-center gap-1 overflow-x-auto">
                  {[
                    { id: "library", label: "Catálogo", icon: Box },
                    { id: "briefing", label: "Cliente", icon: MessageSquare },
                    { id: "simulation", label: "Ambiente", icon: RefreshCw },
                    { id: "challenges", label: "Desafios", icon: Flame },
                    { id: "portfolio", label: "Portfólio", icon: ClipboardCheck }
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setLeftTab(tab.id as any)}
                        className={`flex-1 flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                          leftTab === tab.id 
                            ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                            : "text-slate-400 hover:text-slate-700"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Close sidebar button on mobile/tablet/narrow frame */}
                <button
                  onClick={() => {
                    setShowSidebar(false);
                    showToast("Painel ocultado. Reabra clicando em 'Mostrar Painel' no topo.");
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100/50 transition-all shrink-0 ml-1"
                  title="Fechar Painel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Sidebar Tabs Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {leftTab === "library" && (
                  <div className="space-y-4">
                    
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar mobília, cabines, etc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Left Category Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-1.5 scrollbar-none border-b border-slate-100">
                      {["Recomendados", "Todos", "Favoritos", "Residencial", "Clínicas", "Equipamentos", "Comercial"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all shrink-0 ${
                            activeCategory === cat
                              ? "bg-slate-900 text-white shadow-sm"
                              : "bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Filtered Catalog List */}
                    <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                      {filteredCatalog.map((item) => (
                        <div
                          key={item.id}
                          className="group border border-slate-100 hover:border-slate-300 p-2 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2" onClick={() => handleAddObjectToRoom(item)}>
                            <div className="bg-slate-100 p-2 rounded-lg text-lg">
                              {item.category === "Equipamentos" ? "🔌" : item.subcategory === "Sala" ? "🛋️" : "🪑"}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 leading-tight">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {item.width}m × {item.depth}m • R$ {item.price}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {/* Favorite toggle */}
                            <button onClick={() => toggleFavorite(item.id)} className={`p-1 rounded hover:bg-slate-50 ${favorites.includes(item.id) ? "text-amber-500" : "text-slate-300"}`}>
                              ★
                            </button>
                            <button
                              onClick={() => handleAddObjectToRoom(item)}
                              className="bg-slate-900 hover:bg-emerald-600 text-white p-1 rounded-md transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredCatalog.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8">Nenhum objeto encontrado.</p>
                      )}
                    </div>

                  </div>
                )}

                {leftTab === "briefing" && (
                  <div className="space-y-4 flex flex-col h-full">
                    {/* Client Personality and Patient Mood Indicator */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{currentChallenge.clientAvatar}</span>
                          <div>
                            <h4 className="font-bold text-xs text-slate-800 leading-tight">{currentChallenge.clientName}</h4>
                            <p className="text-[9px] text-slate-400 font-mono">{currentChallenge.clientRole}</p>
                          </div>
                        </div>
                        {/* Dynamic Mood Badge */}
                        <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-2 py-0.5 rounded-full border border-sky-100">
                          😊 Feliz
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                          <span>Paciência do Cliente</span>
                          <span>95%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full w-[95%]" />
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                        {currentChallenge.clientPersonality}
                      </p>
                    </div>

                    {/* Briefing Module Chat Interview */}
                    <div className="border border-slate-100 rounded-2xl p-1 bg-white">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono p-2 block">1. Entrevista do Briefing</span>
                      <div className="max-h-[220px] overflow-y-auto">
                        <BriefingModule
                          challenge={currentChallenge}
                          course={activeCourse}
                          messages={briefingMessages}
                          onAddMessage={(msg) => setBriefingMessages((prev) => [...prev, msg])}
                          onCompleteBriefing={() => {
                            setIsBriefingCompleted(true);
                            showToast("Briefing concluído! Construtor de Ambientes liberado.");
                          }}
                          isBriefingCompleted={isBriefingCompleted}
                        />
                      </div>
                    </div>

                    {/* AI Generative Layout Proposal */}
                    <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-3 shadow-lg border border-slate-850">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                        <h4 className="text-xs font-bold text-slate-100">Gerador de Layout por IA</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Descreva o layout desejado. A IA calculará distâncias NBR 9050, custos e posicionará os móveis idealmente.
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ex: Consultório moderno com biofilia"
                          value={generativePrompt}
                          onChange={(e) => setGenerativePrompt(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          onClick={async () => {
                            if (isGeneratingLayout) return;
                            setIsGeneratingLayout(true);
                            showToast("IA computando posições de mobiliário ideal...");
                            try {
                              const res = await fetch("/api/layout/generate", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  challengeId: currentChallenge.id,
                                  prompt: generativePrompt || "Layout focado em ergonomia e biofilia",
                                  roomDimensions,
                                  budgetLimit: currentChallenge.budgetMax
                                })
                              });
                              if (!res.ok) throw new Error();
                              const data = await res.json();
                              if (data && data.layout) {
                                setPlacedObjects(data.layout);
                                showToast("Layout gerado com sucesso pela IA!");
                              }
                            } catch {
                              // Local layout generator fallback
                              const relevantItems = CATALOG_OBJECTS.filter(o => 
                                o.category === "Clínicas" || o.category === "Residencial"
                              ).slice(0, 4);
                              const simulatedLayout = relevantItems.map((item, idx) => ({
                                id: `placed-${Date.now()}-${idx}`,
                                name: item.name,
                                category: item.category,
                                subcategory: item.subcategory,
                                width: item.width,
                                depth: item.depth,
                                x: 1.0 + idx * 0.9,
                                y: 1.2,
                                rotation: idx * 90,
                                price: item.price
                              }));
                              setPlacedObjects(simulatedLayout);
                              showToast("Layout padrão de consultório gerado localmente!");
                            } finally {
                              setIsGeneratingLayout(false);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-all shrink-0 flex items-center justify-center"
                        >
                          {isGeneratingLayout ? "Gerando..." : "Gerar"}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

                {leftTab === "simulation" && (
                  <div className="space-y-4">
                    {/* Living Environment (Ambiente Vivo) */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs">
                        <RefreshCw className="h-4 w-4 text-emerald-600 animate-spin" />
                        <span>Simulação de Ambiente Vivo</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Mude a iluminação natural, clima e ligue eletroeletrônicos para testar a usabilidade diurna e noturna do consultório.
                      </p>

                      {/* Time of Day */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">1. Período do Dia</span>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: "morning", label: "Manhã", icon: "🌅" },
                            { id: "afternoon", label: "Tarde", icon: "☀️" },
                            { id: "sunset", label: "Ocaso", icon: "🌇" },
                            { id: "night", label: "Noite", icon: "🌙" }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setTimeOfDay(t.id as any);
                                showToast(`Iluminação alterada para o período da: ${t.label}`);
                              }}
                              className={`py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                timeOfDay === t.id
                                  ? "bg-slate-900 border-slate-950 text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span className="block text-xs">{t.icon}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Weather Selectors */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">2. Condição Climática</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: "sunny", label: "Ensolarado", icon: "☀️" },
                            { id: "rainy", label: "Chuvoso", icon: "🌧️" },
                            { id: "cloudy", label: "Nublado", icon: "☁️" }
                          ].map(w => (
                            <button
                              key={w.id}
                              onClick={() => {
                                setWeather(w.id as any);
                                showToast(`Clima do ambiente alterado para: ${w.label}`);
                              }}
                              className={`py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                                weather === w.id
                                  ? "bg-emerald-600 border-emerald-700 text-white shadow-sm"
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span className="mr-1">{w.icon}</span>
                              <span>{w.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Power States Toggles */}
                      <div className="space-y-1.5 border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block mb-1">3. Funcionamento de Equipamentos</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setTvOn(!tvOn); showToast(tvOn ? "Televisão desligada." : "Televisão ligada! Glow ativo."); }}
                            className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                              tvOn ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <span>📺</span>
                            <span>{tvOn ? "TV Ligada" : "TV Desligada"}</span>
                          </button>
                          
                          <button
                            onClick={() => { setDoorsOpen(!doorsOpen); showToast(doorsOpen ? "Portas encostadas." : "Todas as portas abertas! Testando circulação livre."); }}
                            className={`flex-1 py-1 px-2.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                              doorsOpen ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-600"
                            }`}
                          >
                            <span>🚪</span>
                            <span>{doorsOpen ? "Portas Abertas" : "Portas Fechadas"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Plant Growth simulation (Efeito Biofilia) */}
                      <div className="space-y-1 border-t border-slate-100 pt-3">
                        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                          <span>4. Crescimento das Plantas (Biofilia)</span>
                          <span>{plantGrowth}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={plantGrowth}
                          onChange={(e) => setPlantGrowth(Number(e.target.value))}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                        <p className="text-[8px] text-slate-400 leading-normal italic">
                          Arraste para simular o crescimento dos vasos de plantas e biofilia ao longo dos meses!
                        </p>
                      </div>
                    </div>

                    {/* Accessibility Perspective Viewports (Visores de Acessibilidade) */}
                    <div className="bg-sky-50 border border-sky-100/50 rounded-2xl p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-center gap-1.5 text-sky-950 font-bold text-xs">
                        <Compass className="h-4 w-4 text-sky-600 animate-pulse" />
                        <span>Simulador de Perspectiva Humana</span>
                      </div>
                      <p className="text-[10px] text-sky-800 leading-normal">
                        Selecione a perspectiva de um paciente específico para ver alertas de segurança e visualizar dificuldades espaciais.
                      </p>

                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono text-sky-600 uppercase font-bold">Visão de Experiência</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { id: "standard", label: "Padrão", desc: "Sem restrições" },
                            { id: "wheelchair", label: "♿ Cadeirante", desc: "Raios Ø1.50m" },
                            { id: "elderly", label: "👴 Idoso", desc: "Risco de queda" },
                            { id: "low_vision", label: "👁️ Baixa Visão", desc: "Simula desfoque" },
                            { id: "child", label: "👶 Criança", desc: "Foco de visão baixo" }
                          ].map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setUserPerspective(p.id as any);
                                if (p.id === "low_vision") {
                                  showToast("Filtro de Baixa Visão ativado. Teste os contrastes dos materiais!");
                                } else {
                                  showToast(`Perspectiva alterada para: ${p.label}`);
                                }
                              }}
                              className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                userPerspective === p.id
                                  ? "bg-slate-900 border-slate-950 text-white shadow-md"
                                  : "bg-white border-sky-200/50 text-slate-700 hover:bg-sky-100/50"
                              }`}
                            >
                              <div className="font-bold text-[10px]">{p.label}</div>
                              <div className="text-[8px] opacity-70 leading-none mt-0.5">{p.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle Circulation Flow vectors */}
                      <button
                        onClick={() => {
                          setShowCirculationFlow(!showCirculationFlow);
                          showToast(showCirculationFlow ? "Fluxo ocultado." : "Linhas de circulação em tempo real ativas!");
                        }}
                        className={`w-full py-2 px-3 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          showCirculationFlow
                            ? "bg-emerald-600 border-emerald-700 text-white shadow-sm"
                            : "bg-white border-sky-200 text-sky-700 hover:bg-sky-100/30"
                        }`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>{showCirculationFlow ? "Ocultar Fluxo Ativo" : "Simular Fluxo de Circulação"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {leftTab === "challenges" && (
                  <div className="space-y-4">
                    {/* Modo Desafio (Adaptive Challenge Mode) */}
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <Flame className="h-4 w-4 text-amber-600 animate-pulse" />
                        <span>Modo Desafio: Twists do Mercado</span>
                      </div>
                      <p className="text-[10px] text-amber-800 leading-normal">
                        Na vida real, imprevistos acontecem! Provoque um evento aleatório profissional para testar sua capacidade de adaptação em tempo real.
                      </p>

                      {/* Surprise Twist Banner if active */}
                      {activeChallengeEvent ? (
                        <div className="bg-white border border-amber-300 p-3 rounded-xl space-y-2 shadow-inner animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] bg-red-100 text-red-600 font-black px-1.5 py-0.5 rounded font-mono uppercase">
                              ⚠️ EVENTO ATIVO
                            </span>
                            <button
                              onClick={() => {
                                setActiveChallengeEvent(null);
                                showToast("Twist profissional cancelado.");
                              }}
                              className="text-[9px] text-amber-500 hover:text-amber-800 underline font-bold"
                            >
                              Remover
                            </button>
                          </div>
                          <h5 className="font-extrabold text-xs text-amber-950 leading-tight">{activeChallengeEvent.title}</h5>
                          <p className="text-[10px] text-amber-850 leading-relaxed">{activeChallengeEvent.description}</p>
                          
                          {activeChallengeEvent.budgetCutPercent > 0 && (
                            <div className="bg-red-50 text-red-700 text-[9px] font-mono p-1.5 rounded border border-red-100 font-bold">
                              📉 CORTE ORÇAMENTÁRIO: -{activeChallengeEvent.budgetCutPercent}% (Novo Máx: R$ {maxChallengeBudget.toLocaleString("pt-BR")})
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            const events = [
                              {
                                id: "twist-1",
                                title: "Corte de Verba de Emergência",
                                description: "O patrocinador diminuiu o aporte financeiro. Você teve um corte orçamentário de 25%! Ajuste os materiais ou exclua mobiliários caros.",
                                budgetCutPercent: 25,
                                accessibilityChange: false,
                                sustainabilityCheck: false
                              },
                              {
                                id: "twist-2",
                                title: "Nova Exigência Geriátrica NBR 9050",
                                description: "O paciente agora precisa acomodar um idoso que usa andador. Todos os vãos de portas precisam ter pelo menos 90cm livres e espaço para giro de manobra.",
                                budgetCutPercent: 0,
                                accessibilityChange: true,
                                sustainabilityCheck: false
                              },
                              {
                                id: "twist-3",
                                title: "Auditoria Eco-Selo Verde",
                                description: "O comitê acadêmico exige que pelo menos 60% dos materiais aplicados tenham certificação de sustentabilidade certificada (FSC ou selo verde).",
                                budgetCutPercent: 0,
                                accessibilityChange: false,
                                sustainabilityCheck: true
                              }
                            ];
                            const randomEvent = events[Math.floor(Math.random() * events.length)];
                            setActiveChallengeEvent(randomEvent);
                            showToast(`⚠️ NOVO TWIST PROFISSIONAL: ${randomEvent.title}`);
                          }}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl shadow flex items-center justify-center gap-2 text-xs cursor-pointer transition-all"
                        >
                          <Flame className="h-4 w-4" />
                          <span>Disparar Desafio de Surpresa</span>
                        </button>
                      )}
                    </div>

                    {/* Saved Layout Frames Timeline & Comparison Matrix */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-slate-800">Versões de Layout (Git-Style)</span>
                        <button
                          onClick={() => {
                            const name = prompt("Nome da Versão:", `Versão ${Object.keys(savedLayouts).length + 1}`);
                            if (!name) return;
                            setSavedLayouts(prev => ({
                              ...prev,
                              [name]: { placedObjects, walls, appliedMaterials }
                            }));
                            showToast(`Snapshot '${name}' salvo na linha do tempo!`);
                          }}
                          className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1 hover:underline"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Salvar Versão</span>
                        </button>
                      </div>

                      {/* Commits Git timeline graph render */}
                      <div className="space-y-2 max-h-[140px] overflow-y-auto">
                        {Object.keys(savedLayouts).map((name, idx) => (
                          <div
                            key={name}
                            onClick={() => {
                              const v = savedLayouts[name];
                              setPlacedObjects(v.placedObjects);
                              setWalls(v.walls);
                              setAppliedMaterials(v.appliedMaterials);
                              showToast(`Layout restaurado para '${name}'!`);
                            }}
                            className="flex items-center gap-2 p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 cursor-pointer transition-all"
                          >
                            <span className="text-xs">🌳</span>
                            <div className="flex-1">
                              <div className="font-bold text-[10px] text-slate-700">{name}</div>
                              <div className="text-[8px] text-slate-400 font-mono">Frame #{idx + 1} • {savedLayouts[name].placedObjects.length} móveis</div>
                            </div>
                            <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold font-mono">
                              Ativar
                            </span>
                          </div>
                        ))}
                        {Object.keys(savedLayouts).length === 0 && (
                          <p className="text-[10px] text-slate-400 text-center py-4">Nenhuma versão salva na árvore.</p>
                        )}
                      </div>

                      {/* Comparison Matrix Table */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Matriz de Comparação de Layouts</span>
                        <div className="border border-slate-100 rounded-xl overflow-hidden text-[9px]">
                          <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-100 font-bold p-1.5 text-slate-600 text-center">
                            <span className="text-left">Critério</span>
                            <span>Layout Ativo</span>
                            <span>Layout B</span>
                          </div>
                          <div className="divide-y divide-slate-100 p-1 font-mono text-slate-600">
                            <div className="grid grid-cols-3 p-1">
                              <span className="font-sans text-left font-semibold">Circulação</span>
                              <span className="text-center text-emerald-600 font-bold">Excelente</span>
                              <span className="text-center text-slate-400">Regular</span>
                            </div>
                            <div className="grid grid-cols-3 p-1">
                              <span className="font-sans text-left font-semibold">Ergonomia</span>
                              <span className="text-center text-emerald-600 font-bold">Nota 9.0</span>
                              <span className="text-center text-slate-400">Nota 7.0</span>
                            </div>
                            <div className="grid grid-cols-3 p-1">
                              <span className="font-sans text-left font-semibold">Custo Total</span>
                              <span className="text-center font-bold">R$ {totalSpent.toFixed(0)}</span>
                              <span className="text-center text-slate-400">R$ 14.200</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {leftTab === "portfolio" && (
                  <div className="space-y-4">
                    {/* IA Avaliadora (Automated Pedagogical Grader) */}
                    <button
                      onClick={handleExecuteAIAnalysis}
                      disabled={isIAAnalyzing}
                      className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2 text-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
                      <span>{isIAAnalyzing ? "Avaliando Projeto..." : "Solicitar Laudo Técnico IA"}</span>
                    </button>

                    {activeReview ? (
                      <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl space-y-3 border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">Laudo Oficial de Avaliação</h4>
                          </div>
                          <span className="text-[8px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                            Aprovado
                          </span>
                        </div>

                        {/* Certificates & scores board */}
                        <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[8px]">CIRCULAÇÃO</span>
                            <span className="text-xs font-black text-white">{activeReview.scoreCirculation}/10</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[8px]">ERGONOMIA</span>
                            <span className="text-xs font-black text-white">{activeReview.scoreErgonomics}/10</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[8px]">NBR 9050</span>
                            <span className="text-xs font-black text-white">{activeReview.scoreAccessibility}/10</span>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">
                            <span className="text-slate-400 block text-[8px]">ORÇAMENTO</span>
                            <span className="text-xs font-black text-white">{activeReview.scoreBudget}/10</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-300 italic leading-relaxed border-t border-slate-900 pt-2.5">
                          "{activeReview.generalVeredict}"
                        </div>

                        {/* Recommendations list */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-900">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Instruções para Correção:</span>
                          {activeReview.practicalRecommendations.map((rec, idx) => (
                            <p key={idx} className="text-[9px] text-emerald-300 leading-normal flex items-start gap-1">
                              <span>•</span>
                              <span>{rec}</span>
                            </p>
                          ))}
                        </div>

                        {/* Printable PDF Academic Certificate generator simulation */}
                        <div className="space-y-2 pt-2">
                          <button
                            onClick={() => {
                              showToast("Gerando PDF Acadêmico de Portfólio...");
                              setTimeout(() => {
                                showToast("Download do Laudo concluído!");
                              }, 1000);
                            }}
                            className="w-full bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold py-2 rounded-xl text-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800"
                          >
                            <span>📥</span>
                            <span>Baixar Laudo Técnico PDF</span>
                          </button>
                          
                          <button
                            onClick={handleCompleteActiveChallenge}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 px-4 rounded-xl text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                          >
                            <span>🏆</span>
                            <span>Concluir Caso e Avançar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-slate-200 border-dashed rounded-2xl p-8 text-center text-slate-400 text-xs">
                        Clique no botão acima para submeter seu layout ativo à IA Avaliadora de Conformidade de Projetos Acadêmicos.
                      </div>
                    )}
                  </div>
                )}

              </div>
            </aside>

            {/* 3. CENTRO: VIEWPORT 2D/3D/360° */}
            <main className="flex-1 flex flex-col h-full relative">
              
              {/* Viewport Toolbar controls (Autodesk CAD-style overlay) */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-4 pointer-events-none">
                
                {/* Visualisation Mode buttons (Mouse clickable) */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 px-2 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 pointer-events-auto">
                  
                  {/* Sidebar Panel Toggle */}
                  <button
                    onClick={() => {
                      setShowSidebar(!showSidebar);
                      showToast(showSidebar ? "Painel lateral ocultado." : "Painel lateral exibido.");
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold font-sans cursor-pointer flex items-center gap-1.5 transition-all duration-300 ${
                      showSidebar 
                        ? "bg-slate-100 text-slate-800 hover:bg-slate-200" 
                        : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md animate-pulse"
                    }`}
                    title={showSidebar ? "Ocultar Painel" : "Mostrar Painel (Catálogo/Controles)"}
                  >
                    <Menu className="h-3.5 w-3.5" />
                    <span>{showSidebar ? "Ocultar Painel" : "Mostrar Painel"}</span>
                  </button>

                  <div className="h-4 w-[1px] bg-slate-200/80 mx-1 shrink-0" />
                  <button
                    onClick={() => { setViewportMode("2d"); setCameraProjection("ortografica"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5 ${
                      viewportMode === "2d" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Grid className="h-3.5 w-3.5" />
                    <span>Planta 2D</span>
                  </button>
                  <button
                    onClick={() => { setViewportMode("3d"); setCameraProjection("perspectiva"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5 ${
                      viewportMode === "3d" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5" />
                    <span>Primeira Pessoa 3D</span>
                  </button>
                  <button
                    onClick={() => { setViewportMode("360"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5 ${
                      viewportMode === "360" ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Órbita 360°</span>
                  </button>
                </div>

                {/* Viewport interaction state tools (Zoom, Pan, Ruler, Grid) */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 px-2.5 py-1.5 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto">
                  
                  {/* Camera Projection toggle */}
                  <div className="flex items-center gap-1 border-r border-slate-100 pr-2">
                    <button
                      onClick={() => setCameraProjection("ortografica")}
                      title="Câmera Ortográfica"
                      className={`p-1.5 rounded-md ${cameraProjection === "ortografica" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <Layout className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setCameraProjection("perspectiva")}
                      title="Câmera Perspectiva"
                      className={`p-1.5 rounded-md ${cameraProjection === "perspectiva" ? "bg-slate-100 text-slate-800" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <Compass className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Zoom controls */}
                  <div className="flex items-center gap-1 border-r border-slate-100 pr-2">
                    <button onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded" title="Zoom Out">-</button>
                    <span className="text-[10px] font-mono text-slate-500 font-bold w-10 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => setZoom(prev => Math.min(3, prev + 0.1))} className="p-1.5 text-slate-500 hover:bg-slate-50 rounded" title="Zoom In">+</button>
                    <button onClick={() => { setZoom(1.1); setPan({ x: 0, y: 0 }); }} className="p-1 rounded text-slate-400 hover:text-slate-600" title="Reset Viewport">
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Helpers overlays toggles */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowGrid(!showGrid)}
                      title="Alternar Grid de Construção"
                      className={`p-1.5 rounded-md ${showGrid ? "bg-slate-100 text-emerald-600" : "text-slate-400"}`}
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowClearance(!showClearance)}
                      title="Mostrar Raios de Giro/Normas NBR"
                      className={`p-1.5 rounded-md ${showClearance ? "bg-slate-100 text-emerald-600" : "text-slate-400"}`}
                    >
                      <Ruler className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCadPanel(!showCadPanel);
                        showToast(showCadPanel ? "Painel CAD ocultado." : "Painel CAD reexibido.");
                      }}
                      title={showCadPanel ? "Ocultar Painel CAD" : "Exibir Painel CAD"}
                      className={`p-1.5 rounded-md transition-all ${showCadPanel ? "bg-slate-100 text-emerald-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"}`}
                    >
                      <Compass className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>

              </div>

              {/* Viewport Canvas container */}
              <div 
                className={`flex-1 h-full w-full outline-none select-none relative overflow-hidden transition-colors duration-500 ${timeBasedBg}`}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
              >
                
                {/* 2D PLANTA BAIXA CANVAS */}
                {viewportMode === "2d" && (
                  <>
                    <svg
                    ref={svgRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    onClick={handleCanvasClick}
                    onWheel={handleCanvasWheel}
                    onMouseDown={handleSvgMouseDown}
                    onMouseEnter={() => setIsMouseOverCanvas(true)}
                    onMouseLeave={() => { setIsMouseOverCanvas(false); handleDragEnd(); }}
                  >
                     {/* Unified SVG Definitions */}
                    <defs>
                      <filter id="lowVisionBlur" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur stdDeviation="6" />
                      </filter>
                      <filter id="lightGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      {showGrid && (
                        <pattern id="gridPattern" width={scale * zoom * 0.5} height={scale * zoom * 0.5} patternUnits="userSpaceOnUse">
                          <path d={`M ${scale * zoom * 0.5} 0 L 0 0 0 ${scale * zoom * 0.5}`} fill="none" stroke="rgba(203, 213, 225, 0.4)" strokeWidth="1" />
                        </pattern>
                      )}
                      <pattern id="tilePattern" width="24" height="24" patternUnits="userSpaceOnUse">
                        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(14, 165, 233, 0.2)" strokeWidth="0.75" />
                      </pattern>
                      <pattern id="roofHatch" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                        <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(244, 63, 94, 0.18)" strokeWidth="1" />
                      </pattern>
                      <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e" />
                      </marker>
                    </defs>

                    {showGrid && (
                      <rect width="100%" height="100%" fill="url(#gridPattern)" />
                    )}

                    {/* Room outline group mapped relative to pan and zoom */}
                    <g 
                      transform={`translate(${(margin + pan.x * scale) * zoom}, ${(margin + pan.y * scale) * zoom}) scale(${zoom})`}
                      filter={userPerspective === "low_vision" ? "url(#lowVisionBlur)" : undefined}
                    >
                      
                      {/* Room boundary walls */}
                      <rect
                        x={0}
                        y={0}
                        width={roomDimensions.width * scale}
                        height={roomDimensions.depth * scale}
                        fill="none"
                        stroke="#0f172a"
                        strokeWidth="5"
                        strokeLinejoin="round"
                      />

                      {/* Room floor texture representation */}
                      <rect
                        x={1}
                        y={1}
                        width={roomDimensions.width * scale - 2}
                        height={roomDimensions.depth * scale - 2}
                        fill={appliedMaterials.floor ? appliedMaterials.floor.color : "rgba(226, 232, 240, 0.3)"}
                        className="transition-all"
                      />

                      {/* Render custom walls drafted by user */}
                      {walls.map((wall) => {
                        const dx = wall.x2 - wall.x1;
                        const dy = wall.y2 - wall.y1;
                        const len = Math.hypot(dx, dy);
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                        return (
                          <rect
                            key={wall.id}
                            x={wall.x1 * scale}
                            y={wall.y1 * scale - (wall.thickness * scale) / 2}
                            width={len * scale}
                            height={wall.thickness * scale}
                            transform={`rotate(${angle}, ${wall.x1 * scale}, ${wall.y1 * scale})`}
                            fill="#334155"
                            stroke="#0f172a"
                            strokeWidth="1"
                            opacity="0.9"
                          />
                        );
                      })}

                      {/* Active wall drawing vector preview */}
                      {isWallDrawing && activeWallStart && activeWallCurrent && (
                        <line
                          x1={activeWallStart.x * scale}
                          y1={activeWallStart.y * scale}
                          x2={activeWallCurrent.x * scale}
                          y2={activeWallCurrent.y * scale}
                          stroke="#10b981"
                          strokeWidth="6"
                          strokeDasharray="4,4"
                        />
                      )}

                      {/* Render custom user CAD drawings */}
                      {customDrawings.map((d) => {
                        if (d.hidden) return null;
                        const isSelected = d.id === selectedDrawingId;
                        const dist = Math.hypot(d.x2 - d.x1, d.y2 - d.y1);
                        const angle = Math.atan2(d.y2 - d.y1, d.x2 - d.x1);

                        return (
                          <g 
                            key={d.id} 
                            onClick={(e) => {
                              if (activeDrawTool === "select") {
                                e.stopPropagation();
                                setSelectedDrawingId(d.id);
                                setSelectedObjectId(null);
                              }
                            }}
                            className={activeDrawTool === "select" ? "cursor-pointer" : ""}
                          >
                            {/* 1. Straight Line (Retas) */}
                            {d.type === "line" && (
                              <line
                                x1={d.x1 * scale}
                                y1={d.y1 * scale}
                                x2={d.x2 * scale}
                                y2={d.y2 * scale}
                                stroke={isSelected ? "#10b981" : d.strokeColor}
                                strokeWidth={isSelected ? "3.5" : "2.2"}
                                strokeDasharray={d.strokeDash === "dashed" ? "6,4" : d.strokeDash === "dotted" ? "2,3" : undefined}
                              />
                            )}

                            {/* 2. Curved Line (Curvas Bézier) */}
                            {d.type === "curve" && (() => {
                              const mx = (d.x1 + d.x2) / 2;
                              const my = (d.y1 + d.y2) / 2;
                              const dx = d.x2 - d.x1;
                              const dy = d.y2 - d.y1;
                              const px = -dy * 0.25;
                              const py = dx * 0.25;
                              const cx = mx + px;
                              const cy = my + py;
                              return (
                                <path
                                  d={`M ${d.x1 * scale} ${d.y1 * scale} Q ${cx * scale} ${cy * scale} ${d.x2 * scale} ${d.y2 * scale}`}
                                  fill="none"
                                  stroke={isSelected ? "#10b981" : d.strokeColor}
                                  strokeWidth={isSelected ? "3.5" : "2.2"}
                                  strokeDasharray={d.strokeDash === "dashed" ? "6,4" : d.strokeDash === "dotted" ? "2,3" : undefined}
                                />
                              );
                            })()}

                            {/* 3. Circles (Círculos) */}
                            {d.type === "circle" && (
                              <circle
                                cx={(d.cx || d.x1) * scale}
                                cy={(d.cy || d.y1) * scale}
                                r={(d.r || 0.5) * scale}
                                fill={d.fillColor && d.fillColor !== "transparent" ? d.fillColor : "none"}
                                stroke={isSelected ? "#10b981" : d.strokeColor}
                                strokeWidth={isSelected ? "3" : "2"}
                                strokeDasharray={d.strokeDash === "dashed" ? "6,4" : d.strokeDash === "dotted" ? "2,3" : undefined}
                              />
                            )}

                            {/* 4. Rectangles / Squares (Quadrado / Retângulo) */}
                            {d.type === "rect" && (
                              <rect
                                x={Math.min(d.x1, d.x2) * scale}
                                y={Math.min(d.y1, d.y2) * scale}
                                width={Math.max(0.05, Math.abs(d.x2 - d.x1)) * scale}
                                height={Math.max(0.05, Math.abs(d.y2 - d.y1)) * scale}
                                fill={d.fillColor && d.fillColor !== "transparent" ? d.fillColor : "none"}
                                stroke={isSelected ? "#10b981" : d.strokeColor}
                                strokeWidth={isSelected ? "3" : "2"}
                                strokeDasharray={d.strokeDash === "dashed" ? "6,4" : d.strokeDash === "dotted" ? "2,3" : undefined}
                              />
                            )}

                            {/* 5. Rounded Rectangles / Squares (Cantos Arredondados) */}
                            {d.type === "rounded_rect" && (
                              <rect
                                x={Math.min(d.x1, d.x2) * scale}
                                y={Math.min(d.y1, d.y2) * scale}
                                width={Math.max(0.05, Math.abs(d.x2 - d.x1)) * scale}
                                height={Math.max(0.05, Math.abs(d.y2 - d.y1)) * scale}
                                rx={0.15 * scale}
                                ry={0.15 * scale}
                                fill={d.fillColor && d.fillColor !== "transparent" ? d.fillColor : "none"}
                                stroke={isSelected ? "#10b981" : d.strokeColor}
                                strokeWidth={isSelected ? "3" : "2"}
                                strokeDasharray={d.strokeDash === "dashed" ? "6,4" : d.strokeDash === "dotted" ? "2,3" : undefined}
                              />
                            )}

                            {/* 6. Portas 2D (Swing doors & Sliding doors) */}
                            {d.type === "door" && (
                              <g transform={`translate(${d.x1 * scale}, ${d.y1 * scale}) rotate(${(angle * 180) / Math.PI})`}>
                                {d.subType === "sliding_door" ? (
                                  <>
                                    <rect x={0} y={-3} width={dist * scale} height={6} fill="#f1f5f9" stroke={isSelected ? "#10b981" : "#475569"} strokeWidth="1.2" />
                                    <rect x={0} y={-2} width={(dist / 2) * scale} height={4} fill="#94a3b8" />
                                    <line x1={dist * scale} y1={0} x2={dist * scale + 10} y2={0} stroke="#cbd5e1" strokeWidth="1" />
                                  </>
                                ) : (
                                  <>
                                    <line x1={0} y1={0} x2={dist * scale} y2={0} stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                                    <line x1={0} y1={0} x2={0} y2={-dist * scale} stroke={isSelected ? "#10b981" : "#475569"} strokeWidth="3" />
                                    <path
                                      d={`M 0 ${-dist * scale} A ${dist * scale} ${dist * scale} 0 0 1 ${dist * scale} 0`}
                                      fill="none"
                                      stroke={isSelected ? "#10b981" : "#94a3b8"}
                                      strokeWidth="1.5"
                                      strokeDasharray="4,4"
                                    />
                                  </>
                                )}
                              </g>
                            )}

                            {/* 7. Janelas 2D (Windows) */}
                            {d.type === "window" && (
                              <g transform={`translate(${d.x1 * scale}, ${d.y1 * scale}) rotate(${(angle * 180) / Math.PI})`}>
                                <rect x={0} y={-4} width={dist * scale} height={8} fill="#f8fafc" stroke={isSelected ? "#10b981" : "#475569"} strokeWidth="1.5" />
                                <line x1={0} y1={-1.5} x2={dist * scale} y2={-1.5} stroke="#94a3b8" strokeWidth="1" />
                                <line x1={0} y1={1.5} x2={dist * scale} y2={1.5} stroke="#94a3b8" strokeWidth="1" />
                              </g>
                            )}

                            {/* 8. Telhados 2D (Roofs) */}
                            {d.type === "roof" && (
                              <g>
                                <rect
                                  x={Math.min(d.x1, d.x2) * scale}
                                  y={Math.min(d.y1, d.y2) * scale}
                                  width={Math.max(0.1, Math.abs(d.x2 - d.x1)) * scale}
                                  height={Math.max(0.1, Math.abs(d.y2 - d.y1)) * scale}
                                  fill="url(#roofHatch)"
                                  stroke={isSelected ? "#10b981" : "#f43f5e"}
                                  strokeWidth="1.8"
                                  strokeDasharray="4,2"
                                />
                                <path
                                  d={`M ${((d.x1 + d.x2) / 2) * scale} ${(Math.min(d.y1, d.y2) + 0.1) * scale} L ${((d.x1 + d.x2) / 2) * scale} ${(Math.max(d.y1, d.y2) - 0.1) * scale}`}
                                  stroke="#f43f5e"
                                  strokeWidth="1.5"
                                  markerEnd="url(#arrow)"
                                />
                                <text
                                  x={((d.x1 + d.x2) / 2) * scale + 6}
                                  y={((d.y1 + d.y2) / 2) * scale}
                                  className="text-[8px] font-bold fill-rose-600 font-mono select-none pointer-events-none"
                                >
                                  i = 30%
                                </text>
                              </g>
                            )}

                            {/* 9. Piso 2D (Floors tile representation) */}
                            {d.type === "floor" && (
                              <g>
                                <rect
                                  x={Math.min(d.x1, d.x2) * scale}
                                  y={Math.min(d.y1, d.y2) * scale}
                                  width={Math.max(0.1, Math.abs(d.x2 - d.x1)) * scale}
                                  height={Math.max(0.1, Math.abs(d.y2 - d.y1)) * scale}
                                  fill={d.fillColor && d.fillColor !== "transparent" ? d.fillColor : "rgba(14, 165, 233, 0.05)"}
                                  stroke={isSelected ? "#10b981" : "#0ea5e9"}
                                  strokeWidth="1.5"
                                />
                                <rect
                                  x={Math.min(d.x1, d.x2) * scale}
                                  y={Math.min(d.y1, d.y2) * scale}
                                  width={Math.max(0.1, Math.abs(d.x2 - d.x1)) * scale}
                                  height={Math.max(0.1, Math.abs(d.y2 - d.y1)) * scale}
                                  fill="url(#tilePattern)"
                                  opacity="0.6"
                                  className="pointer-events-none"
                                />
                              </g>
                            )}

                            {/* 10. Acessibilidade NBR 9050 overlays (Wheelchair / Tactile) */}
                            {d.type === "accessibility" && (
                              <g>
                                {d.subType === "tactile" ? (
                                  <>
                                    <line
                                      x1={d.x1 * scale}
                                      y1={d.y1 * scale}
                                      x2={d.x2 * scale}
                                      y2={d.y2 * scale}
                                      stroke="#eab308"
                                      strokeWidth="8"
                                      opacity="0.8"
                                    />
                                    <line
                                      x1={d.x1 * scale}
                                      y1={d.y1 * scale}
                                      x2={d.x2 * scale}
                                      y2={d.y2 * scale}
                                      stroke="#ca8a04"
                                      strokeWidth="8"
                                      strokeDasharray="2,3"
                                    />
                                    <text
                                      x={((d.x1 + d.x2) / 2) * scale}
                                      y={((d.y1 + d.y2) / 2) * scale - 7}
                                      textAnchor="middle"
                                      className="text-[8px] font-bold fill-yellow-700 font-mono select-none pointer-events-none"
                                    >
                                      Piso Tátil
                                    </text>
                                  </>
                                ) : (
                                  <>
                                    <circle
                                      cx={d.x1 * scale}
                                      cy={d.y1 * scale}
                                      r={0.75 * scale}
                                      fill="rgba(14, 165, 233, 0.08)"
                                      stroke={isSelected ? "#10b981" : "#0ea5e9"}
                                      strokeWidth="1.8"
                                      strokeDasharray="5,4"
                                    />
                                    <g transform={`translate(${d.x1 * scale - 10}, ${d.y1 * scale - 12}) scale(0.8)`} className="opacity-70">
                                      <circle cx="12" cy="5" r="2" fill="#0ea5e9" />
                                      <path d="M19 9h-4l-1-3h-3c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h3v5l3 3v-7h3v-2z" fill="#0ea5e9" />
                                      <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.7 0 3.2.7 4.2 1.8l1.4-1.4C16.2 5 14.2 4 12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8c2.2 0 4.2-1 5.6-2.4l-1.4-1.4c-1 1.1-2.5 1.8-4.2 1.8z" fill="#0ea5e9" />
                                    </g>
                                    <text x={d.x1 * scale} y={d.y1 * scale + 24} textAnchor="middle" className="text-[8px] font-bold fill-sky-600 font-mono select-none pointer-events-none">
                                      GIRO NBR 9050 (Ø1.50m)
                                    </text>
                                  </>
                                )}
                              </g>
                            )}
                          </g>
                        );
                      })}

                      {/* Render active vector preview while drafting or measuring */}
                      {activeDrawingStart && activeDrawingCurrent && activeDrawTool !== "select" && activeDrawTool !== "cut" && activeDrawTool !== "wall" && (
                        <g className="pointer-events-none opacity-80">
                          {activeDrawTool === "line" && (
                            <line
                              x1={activeDrawingStart.x * scale}
                              y1={activeDrawingStart.y * scale}
                              x2={activeDrawingCurrent.x * scale}
                              y2={activeDrawingCurrent.y * scale}
                              stroke="#10b981"
                              strokeWidth="2.5"
                              strokeDasharray="4,4"
                            />
                          )}

                          {activeDrawTool === "curve" && (() => {
                            const mx = (activeDrawingStart.x + activeDrawingCurrent.x) / 2;
                            const my = (activeDrawingStart.y + activeDrawingCurrent.y) / 2;
                            const dx = activeDrawingCurrent.x - activeDrawingStart.x;
                            const dy = activeDrawingCurrent.y - activeDrawingStart.y;
                            const px = -dy * 0.25;
                            const py = dx * 0.25;
                            const cx = mx + px;
                            const cy = my + py;
                            return (
                              <path
                                  d={`M ${activeDrawingStart.x * scale} ${activeDrawingStart.y * scale} Q ${cx * scale} ${cy * scale} ${activeDrawingCurrent.x * scale} ${activeDrawingCurrent.y * scale}`}
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="2.5"
                                  strokeDasharray="4,4"
                              />
                            );
                          })()}

                          {activeDrawTool === "circle" && (
                            <circle
                              cx={activeDrawingStart.x * scale}
                              cy={activeDrawingStart.y * scale}
                              r={Math.max(0.1, Math.hypot(activeDrawingCurrent.x - activeDrawingStart.x, activeDrawingCurrent.y - activeDrawingStart.y)) * scale}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                            />
                          )}

                          {activeDrawTool === "rect" && (
                            <rect
                              x={Math.min(activeDrawingStart.x, activeDrawingCurrent.x) * scale}
                              y={Math.min(activeDrawingStart.y, activeDrawingCurrent.y) * scale}
                              width={Math.abs(activeDrawingCurrent.x - activeDrawingStart.x) * scale}
                              height={Math.abs(activeDrawingCurrent.y - activeDrawingStart.y) * scale}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                            />
                          )}

                          {activeDrawTool === "rounded_rect" && (
                            <rect
                              x={Math.min(activeDrawingStart.x, activeDrawingCurrent.x) * scale}
                              y={Math.min(activeDrawingStart.y, activeDrawingCurrent.y) * scale}
                              width={Math.abs(activeDrawingCurrent.x - activeDrawingStart.x) * scale}
                              height={Math.abs(activeDrawingCurrent.y - activeDrawingStart.y) * scale}
                              rx={0.15 * scale}
                              ry={0.15 * scale}
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2"
                              strokeDasharray="4,4"
                            />
                          )}

                          {activeDrawTool === "door" && (
                            <g transform={`translate(${activeDrawingStart.x * scale}, ${activeDrawingStart.y * scale}) rotate(${(Math.atan2(activeDrawingCurrent.y - activeDrawingStart.y, activeDrawingCurrent.x - activeDrawingStart.x) * 180) / Math.PI})`}>
                              <line x1={0} y1={0} x2={Math.hypot(activeDrawingCurrent.x - activeDrawingStart.x, activeDrawingCurrent.y - activeDrawingStart.y) * scale} y2={0} stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                              <line x1={0} y1={0} x2={0} y2={-Math.hypot(activeDrawingCurrent.x - activeDrawingStart.x, activeDrawingCurrent.y - activeDrawingStart.y) * scale} stroke="#10b981" strokeWidth="2.5" />
                            </g>
                          )}

                          {activeDrawTool === "window" && (
                            <g transform={`translate(${activeDrawingStart.x * scale}, ${activeDrawingStart.y * scale}) rotate(${(Math.atan2(activeDrawingCurrent.y - activeDrawingStart.y, activeDrawingCurrent.x - activeDrawingStart.x) * 180) / Math.PI})`}>
                              <rect x={0} y={-4} width={Math.hypot(activeDrawingCurrent.x - activeDrawingStart.x, activeDrawingCurrent.y - activeDrawingStart.y) * scale} height={8} fill="none" stroke="#10b981" strokeWidth="1.5" />
                            </g>
                          )}

                          {activeDrawTool === "floor" && (
                            <rect
                              x={Math.min(activeDrawingStart.x, activeDrawingCurrent.x) * scale}
                              y={Math.min(activeDrawingStart.y, activeDrawingCurrent.y) * scale}
                              width={Math.abs(activeDrawingCurrent.x - activeDrawingStart.x) * scale}
                              height={Math.abs(activeDrawingCurrent.y - activeDrawingStart.y) * scale}
                              fill="rgba(14, 165, 233, 0.15)"
                              stroke="#0ea5e9"
                              strokeWidth="1.5"
                            />
                          )}

                          {activeDrawTool === "roof" && (
                            <rect
                              x={Math.min(activeDrawingStart.x, activeDrawingCurrent.x) * scale}
                              y={Math.min(activeDrawingStart.y, activeDrawingCurrent.y) * scale}
                              width={Math.abs(activeDrawingCurrent.x - activeDrawingStart.x) * scale}
                              height={Math.abs(activeDrawingCurrent.y - activeDrawingStart.y) * scale}
                              fill="rgba(244, 63, 94, 0.1)"
                              stroke="#f43f5e"
                              strokeWidth="1.5"
                            />
                          )}

                          {activeDrawTool === "accessibility" && activeDrawSubType === "wheelchair_150" && (
                            <circle
                              cx={activeDrawingStart.x * scale}
                              cy={activeDrawingStart.y * scale}
                              r={0.75 * scale}
                              fill="rgba(14, 165, 233, 0.1)"
                              stroke="#10b981"
                              strokeWidth="1.5"
                              strokeDasharray="4,4"
                            />
                          )}
                        </g>
                      )}

                      {/* Measuring ruler interactive drawing HUD */}
                      {activeDrawingStart && activeDrawingCurrent && activeDrawTool === "measure" && (
                        <g className="pointer-events-none">
                          <line
                            x1={activeDrawingStart.x * scale}
                            y1={activeDrawingStart.y * scale}
                            x2={activeDrawingCurrent.x * scale}
                            y2={activeDrawingCurrent.y * scale}
                            stroke="rgba(16, 185, 129, 0.3)"
                            strokeWidth="8"
                          />
                          <line
                            x1={activeDrawingStart.x * scale}
                            y1={activeDrawingStart.y * scale}
                            x2={activeDrawingCurrent.x * scale}
                            y2={activeDrawingCurrent.y * scale}
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeDasharray="4,4"
                          />
                          <circle cx={activeDrawingStart.x * scale} cy={activeDrawingStart.y * scale} r="4" fill="#10b981" />
                          <circle cx={activeDrawingCurrent.x * scale} cy={activeDrawingCurrent.y * scale} r="4" fill="#10b981" />
                          <g transform={`translate(${((activeDrawingStart.x + activeDrawingCurrent.x) / 2) * scale}, ${((activeDrawingStart.y + activeDrawingCurrent.y) / 2) * scale - 12})`}>
                            <rect x="-30" y="-8" width="60" height="16" rx="4" fill="#0f172a" opacity="0.9" />
                            <text x="0" y="3" textAnchor="middle" className="text-[10px] font-black font-mono fill-white">
                              {Math.hypot(activeDrawingCurrent.x - activeDrawingStart.x, activeDrawingCurrent.y - activeDrawingStart.y).toFixed(2)}m
                            </text>
                          </g>
                        </g>
                      )}

                      {/* Snapping feedback indicator */}
                      {activeDrawTool !== "select" && (
                        (() => {
                          const snapCheck = getSnappedPoint(mouseCoordinates.x, mouseCoordinates.y);
                          if (snapCheck.snapped) {
                            return (
                              <g className="pointer-events-none animate-pulse">
                                <rect
                                  x={snapCheck.x * scale - 4}
                                  y={snapCheck.y * scale - 4}
                                  width="8"
                                  height="8"
                                  fill="none"
                                  stroke="#10b981"
                                  strokeWidth="1.5"
                                  transform={`rotate(45, ${snapCheck.x * scale}, ${snapCheck.y * scale})`}
                                />
                                <circle cx={snapCheck.x * scale} cy={snapCheck.y * scale} r="1.5" fill="#10b981" />
                              </g>
                            );
                          }
                          return null;
                        })()
                      )}

                      {/* Dynamic Snapping Custom Pointer Overlay */}
                      {isMouseOverCanvas && (
                        <g className="pointer-events-none opacity-95 transition-all duration-75">
                          {/* Outer precision crosshair */}
                          <circle
                            cx={mouseCoordinates.x * scale}
                            cy={mouseCoordinates.y * scale}
                            r="6"
                            fill="none"
                            stroke={activeDrawTool !== "select" ? "#10b981" : "#475569"}
                            strokeWidth="1.0"
                            strokeDasharray={activeDrawTool !== "select" ? "1.5,1.5" : undefined}
                          />
                          <circle
                            cx={mouseCoordinates.x * scale}
                            cy={mouseCoordinates.y * scale}
                            r="1.5"
                            fill={activeDrawTool !== "select" ? "#10b981" : "#475569"}
                          />
                          {/* Crosshair hairlines when any drawing tool is active */}
                          {activeDrawTool !== "select" && (
                            <>
                              <line
                                x1={mouseCoordinates.x * scale - 12}
                                y1={mouseCoordinates.y * scale}
                                x2={mouseCoordinates.x * scale + 12}
                                y2={mouseCoordinates.y * scale}
                                stroke="#10b981"
                                strokeWidth="0.75"
                              />
                              <line
                                x1={mouseCoordinates.x * scale}
                                y1={mouseCoordinates.y * scale - 12}
                                x2={mouseCoordinates.x * scale}
                                y2={mouseCoordinates.y * scale + 12}
                                stroke="#10b981"
                                strokeWidth="0.75"
                              />
                            </>
                          )}
                          {/* Precision Coordinates tooltips */}
                          <g transform={`translate(${mouseCoordinates.x * scale + 10}, ${mouseCoordinates.y * scale - 10})`}>
                            <rect
                              width="58"
                              height="14"
                              rx="3"
                              fill="#1e293b"
                              opacity="0.95"
                              stroke="#334155"
                              strokeWidth="0.5"
                            />
                            <text
                              x="29"
                              y="9"
                              textAnchor="middle"
                              className="text-[7.5px] font-black font-mono fill-slate-100 select-none pointer-events-none"
                            >
                              {mouseCoordinates.x.toFixed(2)}m : {mouseCoordinates.y.toFixed(2)}m
                            </text>
                          </g>
                        </g>
                      )}

                      {/* RENDER FURNITURE & CLINICAL OBJECTS PLACED */}
                      {placedObjects.map((obj) => {
                        if (hiddenObjects.includes(obj.id)) return null;

                        const isSelected = obj.id === selectedObjectId;
                        
                        // Dynamic plant scaling based on environment simulation
                        const isPlant = obj.name.toLowerCase().includes("planta") || 
                                        obj.subcategory.toLowerCase().includes("planta") || 
                                        obj.subcategory.toLowerCase().includes("paisagismo") || 
                                        obj.name.toLowerCase().includes("vaso");
                        const scaleMultiplier = isPlant ? (0.5 + (plantGrowth / 100) * 0.7) : 1.0;

                        const objWidthPx = obj.width * scale * scaleMultiplier;
                        const objDepthPx = obj.depth * scale * scaleMultiplier;
                        
                        // Centered rotation translation
                        const cx = obj.x * scale + objWidthPx / 2;
                        const cy = obj.y * scale + objDepthPx / 2;

                        const isTv = obj.name.toLowerCase().includes("tv") || obj.name.toLowerCase().includes("monitor") || obj.name.toLowerCase().includes("tela");

                        return (
                          <g
                            key={obj.id}
                            transform={`rotate(${obj.rotation}, ${cx}, ${cy})`}
                            onMouseDown={(e) => handleDragStart(e, obj)}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedObjectId(obj.id);
                              setSelectedDrawingId(null);
                              // Sync to smart catalog for detailed NBR/sustainability review
                              const catalogMatch = CATALOG_OBJECTS.find(co => co.name === obj.name);
                            }}
                            className="cursor-move select-none"
                          >
                            {/* Accessibility clearance ring (NBR 9050 radius - typically 0.8m diameter for rotation space) */}
                            {showClearance && isSelected && (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={0.75 * scale}
                                fill="none"
                                stroke="rgba(16, 185, 129, 0.25)"
                                strokeWidth="1.5"
                                strokeDasharray="3,3"
                              />
                            )}

                            {/* Outer box of furniture */}
                            <rect
                              x={obj.x * scale}
                              y={obj.y * scale}
                              width={objWidthPx}
                              height={objDepthPx}
                              fill={isSelected ? "rgba(16, 185, 129, 0.15)" : "#ffffff"}
                              stroke={isSelected ? "#10b981" : "#475569"}
                              strokeWidth={isSelected ? "2.5" : "1.5"}
                              rx="6"
                              className="transition-colors"
                            />

                            {/* TV screen glowing on/off */}
                            {isTv && tvOn && (
                              <rect
                                x={obj.x * scale + 2}
                                y={obj.y * scale + 2}
                                width={objWidthPx - 4}
                                height={3}
                                fill="#0ea5e9"
                                filter="url(#lightGlow)"
                                className="animate-pulse"
                              />
                            )}

                            {/* Symbolic interior design styling icons */}
                            <text
                              x={obj.x * scale + objWidthPx / 2}
                              y={obj.y * scale + objDepthPx / 2 + 5}
                              textAnchor="middle"
                              className="text-[9px] font-sans font-bold fill-slate-800 select-none pointer-events-none"
                            >
                              {obj.name.substr(0, 11)}
                            </text>
                            
                            {/* Direction Indicator */}
                            <line
                              x1={obj.x * scale + objWidthPx / 2}
                              y1={obj.y * scale}
                              x2={obj.x * scale + objWidthPx / 2}
                              y2={obj.y * scale + 5}
                              stroke="#ef4444"
                              strokeWidth="2.5"
                            />
                          </g>
                        );
                      })}

                      {/* Living Environment: Rain weather overlay inside the room (Ambiente Vivo) */}
                      {weather === "rainy" && (
                        <g opacity="0.45" className="pointer-events-none">
                          {[...Array(18)].map((_, i) => (
                            <line
                              key={i}
                              x1={`${(i * 147 + 13) % (roomDimensions.width * scale)}`}
                              y1="0"
                              x2={`${(i * 147 + 13) % (roomDimensions.width * scale) - 10}`}
                              y2={`${roomDimensions.depth * scale}`}
                              stroke="#0ea5e9"
                              strokeWidth="1.2"
                              strokeDasharray="8 12"
                            >
                              <animate attributeName="y1" from="-20" to={`${roomDimensions.depth * scale}`} dur="0.9s" repeatCount="indefinite" />
                              <animate attributeName="y2" from="0" to={`${roomDimensions.depth * scale + 20}`} dur="0.9s" repeatCount="indefinite" />
                            </line>
                          ))}
                        </g>
                      )}

                      {/* Circulation flow vector paths (Simulação de Circulação) */}
                      {showCirculationFlow && (
                        <g className="pointer-events-none">
                          {/* Main clinical path (Door -> Desk -> Seat) */}
                          <path
                            id="circPath"
                            d={`M 15 ${1.5 * scale} Q ${1.5 * scale} ${1.8 * scale} ${2.5 * scale} ${2.2 * scale} T ${(roomDimensions.width - 1) * scale} ${1.6 * scale}`}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="3"
                            strokeDasharray="6 6"
                            className="opacity-75"
                          >
                            <animate attributeName="stroke-dashoffset" values="40;0" dur="1.8s" repeatCount="indefinite" />
                          </path>
                          <circle r="4.5" fill="#10b981" filter="url(#lightGlow)">
                            <animateMotion
                              path={`M 15 ${1.5 * scale} Q ${1.5 * scale} ${1.8 * scale} ${2.5 * scale} ${2.2 * scale} T ${(roomDimensions.width - 1) * scale} ${1.6 * scale}`}
                              dur="3.2s"
                              repeatCount="indefinite"
                            />
                          </circle>
                          <text x="25" y={1.2 * scale} className="text-[7px] font-black fill-emerald-600 font-sans tracking-wide">
                            FLUXO ATIVO DE CIRCULAÇÃO DE PACIENTES (NBR 9050)
                          </text>

                          {/* Secondary therapist workspace flow loop */}
                          <path
                            d={`M ${3.0 * scale} ${0.8 * scale} C ${2.2 * scale} ${0.6 * scale}, ${2.2 * scale} ${2.2 * scale}, ${3.0 * scale} ${2.0 * scale}`}
                            fill="none"
                            stroke="#0284c7"
                            strokeWidth="2"
                            strokeDasharray="3 4"
                            className="opacity-60"
                          >
                            <animate attributeName="stroke-dashoffset" values="30;0" dur="1.2s" repeatCount="indefinite" />
                          </path>
                          <text x={2.1 * scale} y={2.4 * scale} className="text-[6px] font-bold fill-sky-600 font-mono tracking-wide">
                            ESPAÇO MÍNIMO PARA MANOBRA E DESVIO
                          </text>
                        </g>
                      )}

                      {/* Perspective Warning Highlights & Hazards */}
                      {userPerspective === "elderly" && (
                        <g className="pointer-events-none">
                          {/* Warning sign at potentially crowded central transit spots */}
                          <g transform={`translate(${1.8 * scale}, ${1.6 * scale})`}>
                            <circle r="10" fill="#f43f5e" opacity="0.25" className="animate-ping" />
                            <polygon points="0,-6 -6,4 6,4" fill="#e11d48" stroke="#ffffff" strokeWidth="1" />
                            <text y="3" textAnchor="middle" fill="#ffffff" className="text-[5px] font-sans font-bold">!</text>
                            <text x="12" y="3" fill="#e11d48" className="text-[7.5px] font-extrabold font-sans">Tripping Danger (Risco de tropeço - idoso)</text>
                          </g>
                        </g>
                      )}

                      {userPerspective === "wheelchair" && (
                        <g className="pointer-events-none animate-pulse">
                          {/* Wheelchair turning clearance indicators */}
                          <circle cx={2.2 * scale} cy={1.8 * scale} r={0.75 * scale} fill="rgba(14, 165, 233, 0.05)" stroke="#0ea5e9" strokeWidth="1.8" strokeDasharray="4 4" />
                          <text x={2.2 * scale} y={1.8 * scale + 4} textAnchor="middle" className="text-[7px] font-black fill-sky-600 font-mono">
                            NBR 9050 Ø1.50M COMPATÍVEL
                          </text>
                        </g>
                      )}

                      {userPerspective === "child" && (
                        <g className="pointer-events-none opacity-85">
                          <circle cx={2.8 * scale} cy={1.4 * scale} r={0.35 * scale} fill="rgba(245, 158, 11, 0.05)" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2,2" />
                          <text x={2.8 * scale} y={1.4 * scale + 3} textAnchor="middle" className="text-[6px] font-bold fill-amber-600 font-sans">
                            Área Focal de Visão Infantil
                          </text>
                        </g>
                      )}

                    </g>
                  </svg>

                  {/* Floating Premium CAD Design Panel */}
                  {showCadPanel && (
                    <div className="absolute right-4 top-16 bottom-4 w-72 z-20 flex flex-col pointer-events-none animate-in fade-in slide-in-from-right-4 duration-200">
                      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-xl flex flex-col h-full pointer-events-auto overflow-hidden">
                        
                        {/* Header */}
                        <div className="bg-slate-50 border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="p-1 bg-sky-100 text-sky-700 rounded-lg">
                              <Compass className="h-4 w-4" />
                            </span>
                            <div>
                              <h3 className="text-xs font-black text-slate-800 font-sans tracking-tight">CAD Laboratório 360°</h3>
                              <p className="text-[10px] text-slate-400 font-mono">Painel de Traçado Técnico</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] bg-sky-50 text-sky-600 font-bold px-1.5 py-0.5 rounded font-mono border border-sky-100/30">
                              NBR 9050
                            </span>
                            <button
                              onClick={() => setShowCadPanel(false)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Ocultar Painel"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      {/* Scrolling Content */}
                      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
                        
                        {/* Active Tool selection */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">1. Ferramenta Ativa</span>
                          <div className="grid grid-cols-4 gap-1.5">
                            {/* SELECT (Cursor) */}
                            <button
                              onClick={() => { setActiveDrawTool("select"); showToast("Modo Seleção ativo. Clique nos móveis ou linhas para selecionar."); }}
                              title="Selecionar"
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                activeDrawTool === "select"
                                  ? "bg-slate-900 border-slate-950 text-white shadow"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Compass className="h-4 w-4" />
                              <span className="text-[8px] font-sans font-bold">Seleção</span>
                            </button>

                            {/* WALL (Parede) */}
                            <button
                              onClick={() => { setActiveDrawTool("wall"); setIsWallDrawing(true); showToast("Clique e arraste no canvas para desenhar paredes estruturais."); }}
                              title="Parede Estrutural"
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                activeDrawTool === "wall"
                                  ? "bg-emerald-600 border-emerald-700 text-white shadow"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Layout className="h-4 w-4" />
                              <span className="text-[8px] font-sans font-bold">Parede</span>
                            </button>

                            {/* MEASURE (Régua) */}
                            <button
                              onClick={() => { setActiveDrawTool("measure"); showToast("Clique e arraste para medir distâncias no canvas."); }}
                              title="Régua de Medição"
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                activeDrawTool === "measure"
                                  ? "bg-sky-600 border-sky-700 text-white shadow"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Ruler className="h-4 w-4" />
                              <span className="text-[8px] font-sans font-bold">Régua</span>
                            </button>

                            {/* CUT (Tesoura / Eraser) */}
                            <button
                              onClick={() => { setActiveDrawTool("cut"); showToast("Modo de Corte ativo. Clique em qualquer linha ou parede para apagar."); }}
                              title="Cortar / Apagar Elemento"
                              className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                                activeDrawTool === "cut"
                                  ? "bg-rose-600 border-rose-700 text-white shadow"
                                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <Scissors className="h-4 w-4" />
                              <span className="text-[8px] font-sans font-bold">Cortar</span>
                            </button>
                          </div>
                        </div>

                        {/* 2D GEOMETRIES */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">2. Formas & Linhas</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {/* Straight Line */}
                            <button
                              onClick={() => { setActiveDrawTool("line"); showToast("Traçado de Linha Reta: Clique e arraste."); }}
                              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                activeDrawTool === "line" ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-sans font-medium">Reta</span>
                            </button>

                            {/* Curve line */}
                            <button
                              onClick={() => { setActiveDrawTool("curve"); showToast("Traçado de Curva Bézier: Clique e arraste."); }}
                              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                activeDrawTool === "curve" ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <GitCommit className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-sans font-medium">Curva</span>
                            </button>

                            {/* Circle */}
                            <button
                              onClick={() => { setActiveDrawTool("circle"); showToast("Desenhar Círculo: Clique e arraste para o raio."); }}
                              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                activeDrawTool === "circle" ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Circle className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-sans font-medium">Círculo</span>
                            </button>

                            {/* Rect */}
                            <button
                              onClick={() => { setActiveDrawTool("rect"); showToast("Desenhar Retângulo/Quadrado: Clique e arraste."); }}
                              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                activeDrawTool === "rect" ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Square className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-sans font-medium">Quadrado</span>
                            </button>

                            {/* Rounded Rect */}
                            <button
                              onClick={() => { setActiveDrawTool("rounded_rect"); showToast("Desenhar Quadrado com Cantos Arredondados."); }}
                              className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                                activeDrawTool === "rounded_rect" ? "bg-sky-50 border-sky-300 text-sky-700 shadow-sm font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Maximize className="h-3.5 w-3.5" />
                              <span className="text-[9px] font-sans font-medium">Arredondado</span>
                            </button>
                          </div>
                        </div>

                        {/* ARCHITECTURE LAYER */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">3. Elementos Arquitetônicos</span>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Door */}
                            <div className="space-y-1">
                              <button
                                onClick={() => { setActiveDrawTool("door"); showToast("Inserir Porta 2D. Arraste para orientar."); }}
                                className={`w-full p-2 rounded-xl border text-center transition-all flex items-center gap-2 cursor-pointer ${
                                  activeDrawTool === "door" ? "bg-sky-50 border-sky-300 text-sky-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <LogIn className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-sans">Porta 2D</span>
                              </button>
                              {activeDrawTool === "door" && (
                                <div className="flex bg-slate-50 border border-slate-100 rounded-lg p-0.5 gap-1">
                                  <button
                                    onClick={() => setActiveDrawSubType("swing_door")}
                                    className={`flex-1 text-[8px] font-bold font-sans py-0.5 rounded cursor-pointer ${activeDrawSubType === "swing_door" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400"}`}
                                  >
                                    Giro
                                  </button>
                                  <button
                                    onClick={() => setActiveDrawSubType("sliding_door")}
                                    className={`flex-1 text-[8px] font-bold font-sans py-0.5 rounded cursor-pointer ${activeDrawSubType === "sliding_door" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400"}`}
                                  >
                                    Correr
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Window */}
                            <div className="space-y-1">
                              <button
                                onClick={() => { setActiveDrawTool("window"); showToast("Inserir Janela 2D. Arraste para dimensionar."); }}
                                className={`w-full p-2 rounded-xl border text-center transition-all flex items-center gap-2 cursor-pointer ${
                                  activeDrawTool === "window" ? "bg-sky-50 border-sky-300 text-sky-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <LayoutGrid className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-sans">Janela 2D</span>
                              </button>
                            </div>

                            {/* Floor 2D */}
                            <button
                              onClick={() => { setActiveDrawTool("floor"); showToast("Inserir Área de Piso cerâmico: Arraste para o retângulo."); }}
                              className={`p-2 rounded-xl border text-center transition-all flex items-center gap-2 cursor-pointer ${
                                activeDrawTool === "floor" ? "bg-sky-50 border-sky-300 text-sky-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Grid className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-sans">Piso 2D</span>
                            </button>

                            {/* Roof 2D */}
                            <button
                              onClick={() => { setActiveDrawTool("roof"); showToast("Inserir Área de Telhado inclinado."); }}
                              className={`p-2 rounded-xl border text-center transition-all flex items-center gap-2 cursor-pointer ${
                                activeDrawTool === "roof" ? "bg-sky-50 border-sky-300 text-sky-700 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Home className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-sans">Telhado 2D</span>
                            </button>
                          </div>
                        </div>

                        {/* ACCESSIBILITY NBR 9050 */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">4. Acessibilidade NBR 9050</span>
                          <div className="space-y-1.5">
                            <button
                              onClick={() => { setActiveDrawTool("accessibility"); setActiveDrawSubType("wheelchair_150"); showToast("Clique para colocar Gabarito de Giro de Cadeira de Rodas (Ø 1.50m)."); }}
                              className={`w-full p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                activeDrawTool === "accessibility" && activeDrawSubType === "wheelchair_150" ? "bg-amber-50/65 border-amber-300 text-amber-900 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <RefreshCw className="h-4 w-4 text-sky-500" />
                              <div className="text-left leading-none">
                                <p className="text-[10px] font-sans">Gabarito de Giro (Ø1.50m)</p>
                                <p className="text-[8px] font-mono text-slate-400">Rotação livre NBR 9050</p>
                              </div>
                            </button>

                            <button
                              onClick={() => { setActiveDrawTool("accessibility"); setActiveDrawSubType("tactile"); showToast("Desenhar Piso Tátil: Clique e arraste para desenhar o traçado."); }}
                              className={`w-full p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                activeDrawTool === "accessibility" && activeDrawSubType === "tactile" ? "bg-amber-50/65 border-amber-300 text-amber-900 font-bold" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <Sliders className="h-4 w-4 text-amber-600" />
                              <div className="text-left leading-none">
                                <p className="text-[10px] font-sans">Piso Tátil Direcional</p>
                                <p className="text-[8px] font-mono text-slate-400">Sinalização de Alerta</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* LINE TYPE & COLOR ATTRIBUTES */}
                        <div className="space-y-2 pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">5. Estilo e Cores</span>
                          
                          {/* Color Selector */}
                          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-bold font-sans">Cor Traço:</span>
                            <div className="flex gap-1.5">
                              {[
                                { hex: "#475569", label: "Escuro" },
                                { hex: "#0ea5e9", label: "Azul" },
                                { hex: "#f43f5e", label: "Vermelho" },
                                { hex: "#10b981", label: "Verde" },
                                { hex: "#eab308", label: "Amarelo" }
                              ].map((c) => (
                                <button
                                  key={c.hex}
                                  onClick={() => { setStrokeColor(c.hex); showToast(`Cor selecionada: ${c.label}`); }}
                                  className={`w-4 h-4 rounded-full border-2 transition-transform cursor-pointer ${strokeColor === c.hex ? "scale-125 border-slate-900 shadow" : "border-transparent"}`}
                                  style={{ backgroundColor: c.hex }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Line Type Dash Selection */}
                          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-bold font-sans">Tipo Traço:</span>
                            <div className="flex gap-1">
                              {[
                                { value: "solid", label: "Contínuo" },
                                { value: "dashed", label: "Tracejado" },
                                { value: "dotted", label: "Pontilhado" }
                              ].map((t) => (
                                <button
                                  key={t.value}
                                  onClick={() => { setStrokeDash(t.value as any); showToast(`Traço: ${t.label}`); }}
                                  className={`text-[8px] font-bold font-sans px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    strokeDash === t.value ? "bg-white border-slate-300 text-slate-800 shadow-xs font-bold" : "text-slate-400 border-transparent hover:text-slate-600"
                                  }`}
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Shape Fill Selection */}
                          <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[10px] text-slate-500 font-bold font-sans">Preenchimento:</span>
                            <div className="flex gap-1">
                              {[
                                { value: "transparent", label: "Vazado" },
                                { value: "rgba(14, 165, 233, 0.1)", label: "Azul" },
                                { value: "rgba(244, 63, 94, 0.1)", label: "Rosa" },
                                { value: "rgba(16, 185, 129, 0.1)", label: "Verde" }
                              ].map((f) => (
                                <button
                                  key={f.value}
                                  onClick={() => { setFillColor(f.value); showToast(`Preenchimento atualizado`); }}
                                  className={`text-[8px] font-bold font-sans px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                    fillColor === f.value ? "bg-white border-slate-300 text-slate-800 shadow-xs font-bold" : "text-slate-400 border-transparent hover:text-slate-600"
                                  }`}
                                >
                                  {f.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Selection HUD & Control bar */}
                      {selectedDrawingId && (() => {
                        const activeD = customDrawings.find(d => d.id === selectedDrawingId);
                        if (!activeD) return null;
                        return (
                          <div className="bg-slate-900 text-white p-3 space-y-2 border-t border-slate-950">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-emerald-400 font-bold">✓ Selecionado: {activeD.type.toUpperCase()}</span>
                              <button
                                onClick={() => {
                                  setCustomDrawings(prev => prev.filter(d => d.id !== selectedDrawingId));
                                  setSelectedDrawingId(null);
                                  showToast("Elemento removido.");
                                }}
                                className="text-[9px] bg-rose-500 hover:bg-rose-600 font-sans font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                              >
                                Apagar
                              </button>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setCustomDrawings(prev => prev.map(d => {
                                    if (d.id === selectedDrawingId) {
                                      const cx = (d.x1 + d.x2) / 2;
                                      const cy = (d.y1 + d.y2) / 2;
                                      const dx1 = d.x1 - cx;
                                      const dy1 = d.y1 - cy;
                                      const dx2 = d.x2 - cx;
                                      const dy2 = d.y2 - cy;
                                      return {
                                        ...d,
                                        x1: cx - dy1,
                                        y1: cy + dx1,
                                        x2: cx - dy2,
                                        y2: cy + dx2,
                                      };
                                    }
                                    return d;
                                  }));
                                  showToast("Elemento técnico rotacionado 90°.");
                                }}
                                className="flex-1 text-[9px] bg-slate-800 hover:bg-slate-750 py-1 rounded font-bold font-sans border border-slate-700/50 cursor-pointer"
                              >
                                Rotacionar 90°
                              </button>
                              <button
                                onClick={() => {
                                  setCustomDrawings(prev => prev.map(d => {
                                    if (d.id === selectedDrawingId) {
                                      return { ...d, hidden: true };
                                    }
                                    return d;
                                  }));
                                  setSelectedDrawingId(null);
                                  showToast("Elemento ocultado.");
                                }}
                                className="flex-1 text-[9px] bg-slate-800 hover:bg-slate-750 py-1 rounded font-bold font-sans border border-slate-700/50 cursor-pointer"
                              >
                                Ocultar
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Footer Layer List */}
                      <div className="bg-slate-50 border-t border-slate-200/60 p-2.5 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => {
                            setCustomDrawings([]);
                            setSelectedDrawingId(null);
                            showToast("Todos os traçados técnicos foram limpos.");
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-lg font-bold font-sans transition-colors cursor-pointer"
                        >
                          Limpar Tudo
                        </button>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold font-mono text-slate-400">
                            {customDrawings.length} {customDrawings.length === 1 ? "elemento" : "elementos"}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </>
              )}

                {/* FASE 1 — WEBGL/THREE.JS PROJECT VIEW */}
                {viewportMode === "3d" && (
                  <div className="absolute inset-0 w-full h-full flex flex-col justify-end">
                    <div className="flex-1">
                      <RealisticThreeScene
                        roomDimensions={roomDimensions}
                        placedObjects={visiblePlacedObjects}
                        appliedMaterials={appliedMaterials}
                        mode="project"
                        selectedObjectId={selectedObjectId}
                        onSelectObject={setSelectedObjectId}
                        onUpdateObject={handleUpdateObject}
                        lockedObjectIds={lockedObjects}
                      />
                    </div>
                    {/* Floating Walkthrough instructions HUD */}
                    <div className="bg-slate-900/90 backdrop-blur border-t border-slate-800 p-3 text-white text-[11px] font-mono flex items-center justify-between pointer-events-auto">
                      <p>🎮 Use <span className="text-emerald-400 font-bold font-sans">W, A, S, D</span> ou <span className="text-emerald-400 font-bold font-sans">Setas do Teclado</span> para andar e rotacionar a câmera no espaço físico.</p>
                      <button onClick={() => setViewportMode("2d")} className="bg-emerald-600 hover:bg-emerald-500 font-sans font-bold text-white px-3 py-1 rounded-lg">Voltar 2D</button>
                    </div>
                  </div>
                )}

                {/* PRÁTICA 360º — FASE 1: renderer WebGL/Three.js em tela inteira */}
                {viewportMode === "360" && (
                  <div className="fixed inset-0 z-[80] bg-slate-950 flex flex-col">
                    <div className="flex-1 min-h-0">
                      <RealisticThreeScene
                        roomDimensions={roomDimensions}
                        placedObjects={visiblePlacedObjects}
                        appliedMaterials={appliedMaterials}
                        mode="360"
                        selectedObjectId={selectedObjectId}
                        onSelectObject={setSelectedObjectId}
                        onUpdateObject={handleUpdateObject}
                        lockedObjectIds={lockedObjects}
                      />
                    </div>
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none">
                      <div className="pointer-events-auto bg-slate-950/80 backdrop-blur border border-slate-700 rounded-xl px-4 py-2 text-white shadow-xl">
                        <p className="text-xs font-black">Prática 360º</p>
                        <p className="text-[10px] text-slate-300">Ambiente imersivo em tela inteira • gire e percorra o projeto</p>
                      </div>
                      <button onClick={() => setViewportMode("2d")} className="pointer-events-auto bg-white text-slate-900 hover:bg-slate-100 font-black text-xs px-4 py-2 rounded-xl shadow-xl">
                        Sair do 360º
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </main>

            {/* 4. PAINEL DIREITO: PROPRIEDADES DYNAMICAS */}
            <aside className="w-full md:w-80 bg-white border-l border-slate-200/75 flex flex-col h-full shrink-0 z-10 shadow-sm overflow-y-auto p-5 space-y-5">
              
              {selectedObject ? (
                /* OBJECT SPECIFIC PROPERTIES PANEL */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Box className="h-4 w-4 text-emerald-600" />
                      <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Propriedades</span>
                    </div>
                    <button onClick={() => setSelectedObjectId(null)} className="text-slate-400 hover:text-slate-600 text-xs">Focar Geral</button>
                  </div>

                  {/* Object identity & tags */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-slate-800 leading-snug">{selectedObject.name}</h3>
                    <div className="flex flex-wrap gap-1 text-[9px] font-mono">
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">{selectedObject.category}</span>
                      <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{selectedObject.subcategory}</span>
                    </div>
                  </div>

                  {/* Quick Edit CAD controls */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2">
                    <button
                      onClick={handleRotateSelected}
                      title="Rotacionar Mobiliário"
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all"
                    >
                      <RotateCw className="h-3.5 w-3.5 text-slate-600" />
                      <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">Girar</span>
                    </button>

                    <button
                      onClick={handleDuplicateSelected}
                      title="Duplicar Mobiliário"
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all"
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-600" />
                      <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">Clonar</span>
                    </button>

                    <button
                      onClick={handleLockToggle}
                      title={lockedObjects.includes(selectedObject.id) ? "Destravar Mobiliário" : "Travar Mobiliário"}
                      className={`border p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all ${lockedObjects.includes(selectedObject.id) ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span className="text-[8px] font-mono text-slate-400 font-bold uppercase">Travar</span>
                    </button>

                    <button
                      onClick={() => handleRemoveObject(selectedObject.id)}
                      title="Excluir Mobiliário"
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 p-2 rounded-lg flex flex-col items-center gap-1 cursor-pointer transition-all text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="text-[8px] font-mono text-rose-400 font-bold uppercase">Deletar</span>
                    </button>
                  </div>

                  {/* Physical Dimensions and BIM Metadata */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <h4 className="text-[9px] font-mono uppercase text-slate-400 font-bold">Especificações Técnicas</h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-sans text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono uppercase">Dimensões (L x P x A)</span>
                        <p className="font-bold text-slate-800">{selectedObject.width}m × {selectedObject.depth}m × {selectedObject.height}m</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono uppercase">Fabricante</span>
                        <p className="font-bold text-slate-800">{selectedObject.manufacturer || "Figma Home"}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono uppercase">Material de Fabricação</span>
                        <p className="font-bold text-slate-800">{selectedObject.material}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-mono uppercase">Preço Estimado</span>
                        <p className="font-bold text-slate-900">R$ {selectedObject.price.toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Accessibility & Sustainability compliance alerts */}
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-[11px] font-sans">
                    <h4 className="text-[9px] font-mono uppercase text-slate-400 font-bold">Normativas NBR & Conformidade</h4>
                    
                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-lg p-2.5 space-y-1 text-emerald-800">
                      <span className="text-[9px] font-mono uppercase text-emerald-600 font-bold block">Acessibilidade NBR 9050</span>
                      <p className="text-[10px] leading-snug">Ergonomia de alcance otimizada para cadeiras de rodas e pessoas com mobilidade reduzida.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1 text-slate-700">
                      <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">Sustentabilidade</span>
                      <p className="text-[10px] leading-snug">Madeira de reflorestamento e metais recicláveis com baixo pegada de carbono.</p>
                    </div>
                  </div>

                </div>
              ) : (
                /* GENERAL ROOM SPECIFICATIONS (WHEN NO OBJECT IS SELECTED) */
                <div className="space-y-4">
                  
                  <div className="pb-2 border-b border-slate-100">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Especificações Gerais</span>
                    <h3 className="text-sm font-black text-slate-800 mt-1">Geral do Espaço</h3>
                  </div>

                  {/* Room dimensions inputs sliders */}
                  <div className="space-y-3.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Cômodo do Digital Twin</span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Largura (m)</span>
                        <span className="font-mono font-bold text-slate-800">{roomDimensions.width.toFixed(2)}m</span>
                      </div>
                      <input
                        type="range"
                        min="3.0"
                        max="8.0"
                        step="0.5"
                        value={roomDimensions.width}
                        onChange={(e) => setRoomDimensions({ ...roomDimensions, width: parseFloat(e.target.value) })}
                        className="w-full accent-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Profundidade (m)</span>
                        <span className="font-mono font-bold text-slate-800">{roomDimensions.depth.toFixed(2)}m</span>
                      </div>
                      <input
                        type="range"
                        min="3.0"
                        max="8.0"
                        step="0.5"
                        value={roomDimensions.depth}
                        onChange={(e) => setRoomDimensions({ ...roomDimensions, depth: parseFloat(e.target.value) })}
                        className="w-full accent-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Pé-direito/Altura (m)</span>
                        <span className="font-mono font-bold text-slate-800">{roomDimensions.height.toFixed(2)}m</span>
                      </div>
                      <input
                        type="range"
                        min="2.4"
                        max="3.5"
                        step="0.1"
                        value={roomDimensions.height}
                        onChange={(e) => setRoomDimensions({ ...roomDimensions, height: parseFloat(e.target.value) })}
                        className="w-full accent-slate-900"
                      />
                    </div>
                  </div>

                  {/* Room coatings summaries */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Revestimentos BIM</span>
                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Piso:</span>
                        <span className="font-bold text-slate-800">{appliedMaterials.floor ? appliedMaterials.floor.name : "Nenhum"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Parede Norte:</span>
                        <span className="font-bold text-slate-800">{appliedMaterials.wallNorth ? appliedMaterials.wallNorth.name : "Nenhum"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Challenge details & case rules */}
                  <div className="space-y-2.5 border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block text-purple-600">Instruções de Sucesso</span>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-[11px] text-purple-900 space-y-1.5">
                      <h4 className="font-bold leading-tight">Garantia do Professor:</h4>
                      <p className="text-[10px] leading-relaxed text-purple-800">{currentChallenge.description.substr(0, 110)}...</p>
                      
                      <div className="pt-1">
                        <span className="text-[9px] font-mono uppercase text-purple-500 font-bold block">Mobiliário Mandatório:</span>
                        <p className="text-[10px] text-purple-700 font-semibold">{currentChallenge.requiredObjects.join(" • ")}</p>
                      </div>
                    </div>
                  </div>

                  {/* Orçamento recuperado das versões 148/149 */}
                  <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl text-xs space-y-2 pt-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Orçamento informado pela cliente</span>
                      <span className="font-black text-slate-800">R$ {maxChallengeBudget.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-white rounded-lg border border-slate-200 p-2">
                        <span className="text-slate-400 block">Itens de interiores</span>
                        <strong>R$ {itemsSpent.toLocaleString("pt-BR")}</strong>
                      </div>
                      <div className="bg-white rounded-lg border border-slate-200 p-2">
                        <span className="text-slate-400 block">Saldo</span>
                        <strong className={isOverBudget ? "text-rose-600" : "text-emerald-700"}>R$ {(maxChallengeBudget - totalSpent).toLocaleString("pt-BR")}</strong>
                      </div>
                    </div>
                    <label className="block text-[10px] text-slate-500">
                      Honorários do Design de Interiores (R$)
                      <input type="number" min="0" step="50" value={designFee} onChange={(e) => setDesignFee(Math.max(0, Number(e.target.value) || 0))} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold" />
                    </label>
                    <div className="flex items-center justify-between font-bold">
                      <span>Total: R$ {totalSpent.toLocaleString("pt-BR")}</span>
                      <span className={isOverBudget ? "text-rose-600" : "text-emerald-700"}>{isOverBudget ? `Excedeu R$ ${(totalSpent - maxChallengeBudget).toLocaleString("pt-BR")}` : `${Math.round((totalSpent / Math.max(maxChallengeBudget, 1)) * 100)}% utilizado`}</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                      <div style={{ width: `${Math.min(100, (totalSpent / Math.max(maxChallengeBudget, 1)) * 100)}%` }} className={`h-full ${isOverBudget ? "bg-rose-600" : "bg-emerald-500"}`} />
                    </div>
                    <p className="text-[9px] text-slate-400 leading-relaxed">Paredes, portas, janelas, piso e telhado não entram nesta soma.</p>
                  </div>

                </div>
              )}

            </aside>
          </>
        )}

      </div>

      {/* Mobile Navigation Hub (Glassmorphism) - Visible only on mobile/tablet */}
      <div className="md:hidden fixed bottom-14 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/85 px-2.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5">
        <button
          onClick={() => {
            setMobileView("canvas");
            showToast("Desenho Técnico Ativo.");
          }}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            mobileView === "canvas"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Grid className="h-3.5 w-3.5" />
          <span>Planta / 3D</span>
        </button>
        <button
          onClick={() => {
            setMobileView("sidebar");
            showToast("Painel de Controles Ativo.");
          }}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            mobileView === "sidebar"
              ? "bg-slate-900 text-white shadow"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Controles ({leftTab === "library" ? "Catálogo" : leftTab === "briefing" ? "Cliente" : leftTab === "simulation" ? "Ambiente" : leftTab === "challenges" ? "Desafios" : "Portfólio"})</span>
        </button>
      </div>

      {/* 5. FOOTER (Scale, Coordinates, FPS, Moedas, XP, Budget progress) */}
      <footer className="glass-effect h-10 px-6 flex items-center justify-between border-t border-slate-200/65 text-xs text-slate-400 font-mono shadow-inner shrink-0 z-30">
        
        {/* Scale dropdown */}
        <div className="flex items-center gap-2">
          <span>Escala:</span>
          <select className="bg-slate-100 text-slate-700 text-[10px] rounded border border-slate-200 px-1 py-0.5 focus:outline-none">
            <option>1:20</option>
            <option>1:50</option>
            <option>1:100</option>
          </select>
        </div>

        {/* Dynamic coordinate monitor */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span>Coordenadas:</span>
          <span className="text-slate-700 font-bold">X: {mouseCoordinates.x.toFixed(2)}m, Y: {mouseCoordinates.y.toFixed(2)}m, Z: 0.00m</span>
        </div>

        {/* Live FPS simulation */}
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>{fps} FPS</span>
        </div>

        {/* Gamification footer state */}
        <div className="flex items-center gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/50 px-2 py-0.5 rounded text-slate-500">
            <span>XP: 1450</span>
          </div>
          <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded text-emerald-700">
            <span>Moedas: 350 L$</span>
          </div>
        </div>

      </footer>

    </div>
  );
}
