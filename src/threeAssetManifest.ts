export type AssetQuality = "poc" | "review" | "approved";

export interface ThreeAssetDefinition {
  key: string;
  label: string;
  url: string;
  quality: AssetQuality;
  catalogNames: string[];
  notes: string;
}

/**
 * FASE 1 — prova de conceito.
 * Estes modelos servem para validar pipeline GLB/GLTF, escala, posicionamento e renderização.
 * NÃO são classificados como fotorrealistas finais.
 */
export const THREE_ASSETS: ThreeAssetDefinition[] = [
  { key: "desk-designer-poc", label: "Mesa da designer — POC", url: "/assets/models/poc/SM_Desk_Designer_POC.glb", quality: "poc", catalogNames: ["Mesa de Trabalho", "Bancada de trabalho", "Mesa de revisão de projetos A0"], notes: "Auditoria visual final pendente." },
  { key: "chair-ergonomic-poc", label: "Cadeira ergonômica — POC", url: "/assets/models/poc/SM_Chair_Ergonomic_POC.glb", quality: "poc", catalogNames: ["Cadeira operacional", "Poltrona ergonômica", "Cadeira de estudo juvenil ergonômica"], notes: "Ainda não aprovada como asset definitivo." },
  { key: "dual-monitor-poc", label: "Estação com dois monitores — POC", url: "/assets/models/poc/SM_DualMonitor_Setup_POC.glb", quality: "poc", catalogNames: ["Estação técnica individual com dois monitores", "Computador Desktop + Monitor 24\""], notes: "Detalhamento de cabos e periféricos pendente." },
  { key: "cabinet-office-poc", label: "Armário de escritório — POC", url: "/assets/models/poc/SM_Cabinet_Office_POC.glb", quality: "poc", catalogNames: ["Armário alto", "Armário confidencial de projetos", "Armário de rotina com portas"], notes: "Ferragens e acabamento final pendentes." },
  { key: "floor-lamp-poc", label: "Luminária de piso — POC", url: "/assets/models/poc/SM_FloorLamp_POC.glb", quality: "poc", catalogNames: ["Luminária de piso com cúpula têxtil", "Luminária de Piso Articulada"], notes: "Mantida no piso conforme regra aprovada." },
  { key: "plant-ficus-poc", label: "Ficus em vaso — POC", url: "/assets/models/poc/SM_Plant_Ficus_POC.glb", quality: "poc", catalogNames: ["Ficus-benjamina em vaso", "Ficus lyrata"], notes: "Foliagem final pendente." },
  { key: "rug-poc", label: "Tapete — POC", url: "/assets/models/poc/SM_Rug_POC.glb", quality: "poc", catalogNames: ["Tapete de base antiderrapante", "Tapete Orgânico Bege"], notes: "Textura/fibra final pendente." },
  { key: "door-wood-poc", label: "Porta de madeira — POC", url: "/assets/models/poc/SM_Door_Wood_POC.glb", quality: "poc", catalogNames: ["Porta de giro 90 cm", "Porta pivotante · madeira 1"], notes: "Elemento arquitetônico; não integra orçamento de interiores no caso atual." },
  { key: "window-frame-poc", label: "Janela — POC", url: "/assets/models/poc/SM_Window_Frame_POC.glb", quality: "poc", catalogNames: ["Janela de correr", "Janela de correr · 1"], notes: "Elemento arquitetônico; não integra orçamento de interiores no caso atual." }
];

const normalize = (value: string) => value.trim().toLocaleLowerCase("pt-BR");

export function findThreeAssetByCatalogName(name: string): ThreeAssetDefinition | undefined {
  const target = normalize(name);
  return THREE_ASSETS.find((asset) => asset.catalogNames.some((candidate) => normalize(candidate) === target));
}
