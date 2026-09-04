export enum CourseType {
  INTERIORS = "Design de Interiores",
  SPEECH_THERAPY = "Fonoaudiologia",
  PSYCHOLOGY = "Psicologia",
  PHYSIOTHERAPY = "Fisioterapia",
  NURSING = "Enfermagem"
}

export interface Challenge {
  id: string;
  course: CourseType;
  title: string;
  description: string;
  clientName: string;
  clientRole: string;
  clientPersonality: string;
  clientAvatar: string;
  budgetMax: number;
  minArea: number;
  requiredObjects: string[];
  rubric: {
    circulation: string;
    ergonomics: string;
    sustainability: string;
    accessibility: string;
  };
  unlocked: boolean;
}

export interface CatalogObject {
  id: string;
  name: string;
  category: "Residencial" | "Clínicas" | "Comercial" | "Equipamentos";
  subcategory: string;
  width: number;
  depth: number;
  height: number;
  price: number;
  weight: number;
  material: string;
  manufacturer: string;
  sustainability: string;
  accessibility: string;
  norms: string;
  svgIcon: string;
}

export interface PlacedObject {
  id: string;
  catalogId: string;
  name: string;
  category: string;
  subcategory: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  price: number;
  manufacturer: string;
  material: string;
  lightSource?: boolean;
  isLit?: boolean;
  isOpen?: boolean;
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  height: number;
}

export interface Material {
  id: string;
  name: string;
  category: "porcelanatos" | "pisos vinílicos" | "laminados" | "mármores" | "granitos" | "tintas" | "papéis de parede" | "tecidos" | "MDF" | "madeiras";
  material: string;
  price: number;
  color: string;
  manufacturer: string;
  sustainability: string;
}

export interface AppliedMaterials {
  floor: Material | null;
  wallNorth: Material | null;
  wallSouth: Material | null;
  wallEast: Material | null;
  wallWest: Material | null;
}

export interface BriefingMessage {
  id: string;
  sender: "student" | "client";
  text: string;
  timestamp: string;
}

export interface AIPedagogicalReview {
  scoreCirculation: number;
  scoreErgonomics: number;
  scoreAcousticLighting: number;
  scoreAccessibility: number;
  scoreBudget: number;
  scoreSustainability: number;
  scoreBriefingMatch: number;
  feedbackCirculation: string;
  feedbackErgonomics: string;
  feedbackAcousticLighting: string;
  feedbackAccessibility: string;
  feedbackBudget: string;
  feedbackSustainability: string;
  feedbackBriefingMatch: string;
  generalVeredict: string;
  practicalRecommendations: string[];
}

export interface PortfolioVersion {
  id: string;
  title: string;
  timestamp: string;
  placedObjects: PlacedObject[];
  walls?: Wall[];
  appliedMaterials: AppliedMaterials;
  budgetSpent: number;
  review: AIPedagogicalReview | null;
  screenshot?: string;
}

export interface StudentProgress {
  id: string;
  studentName: string;
  avatar: string;
  course: CourseType;
  challengeTitle: string;
  completedSteps: number;
  lastScore: number;
  budgetStatus: "ok" | "exceeded";
  lastActive: string;
}

export interface CustomDrawing {
  id: string;
  type: "line" | "curve" | "circle" | "rect" | "rounded_rect" | "door" | "window" | "roof" | "floor" | "accessibility";
  subType?: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cx?: number;
  cy?: number;
  r?: number;
  width?: number;
  depth?: number;
  height?: number;
  rotation: number;
  strokeDash?: string;
  strokeColor: string;
  fillColor?: string;
  name?: string;
  hidden?: boolean;
}
