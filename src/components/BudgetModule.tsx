import React, { useState } from "react";
import { PlacedObject, Material, Challenge } from "../types";
import { CATALOG_OBJECTS } from "../data";
import { calculateBudgetSummary } from "../budgetEngine";
import { 
  DollarSign, RefreshCw, Layers, CheckCircle2, AlertTriangle, 
  ChevronRight, Building2, TrendingDown, HelpCircle, Package 
} from "lucide-react";

interface BudgetModuleProps {
  challenge: Challenge;
  placedObjects: PlacedObject[];
  appliedMaterials: { floor: Material | null; wallNorth: Material | null; wallSouth: Material | null; wallEast: Material | null; wallWest: Material | null };
  roomDimensions: { width: number; depth: number; height: number };
  onUpdateObject: (id: string, updated: Partial<PlacedObject>) => void;
  onReplacePlacedObject: (id: string, newCatalogId: string) => void;
  designFee?: number;
}

export const BudgetModule: React.FC<BudgetModuleProps> = ({
  challenge,
  placedObjects,
  appliedMaterials,
  roomDimensions,
  onReplacePlacedObject,
  designFee = 0,
}) => {
  const [selectedSwapObjectId, setSelectedSwapObjectId] = useState<string | null>(null);

  // 1. Calculate Areas and Material Costs
  const floorArea = roomDimensions.width * roomDimensions.depth;
  const wallNorthArea = roomDimensions.width * roomDimensions.height;
  const wallSouthArea = roomDimensions.width * roomDimensions.height;
  const wallEastArea = roomDimensions.depth * roomDimensions.height;
  const wallWestArea = roomDimensions.depth * roomDimensions.height;

  const budget = calculateBudgetSummary(challenge.budgetMax, placedObjects, designFee);
  const budgetRatio = budget.clientBudget > 0 ? budget.totalSpent / budget.clientBudget : 0;

  // Alternative Swapping Finder
  // Finds items in the same subcategory to compare/swap
  const handleSwapFinder = (id: string) => {
    setSelectedSwapObjectId(id === selectedSwapObjectId ? null : id);
  };

  const getAlternativesFor = (placedObj: PlacedObject) => {
    return CATALOG_OBJECTS.filter(
      (item) => item.subcategory === placedObj.subcategory && item.id !== placedObj.catalogId
    );
  };

  const swapObject = (placedId: string, newCatalogId: string) => {
    onReplacePlacedObject(placedId, newCatalogId);
    setSelectedSwapObjectId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Cost Breakdown & Charts */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
            Módulo 6
          </span>
          <h3 className="text-lg font-bold text-slate-800 mt-1 font-sans">Orçamento Inteligente & Fornecedores</h3>
          <p className="text-xs text-slate-500 leading-relaxed mt-1">
            O cálculo considera mobiliário, equipamentos, iluminação, decoração e honorários. Elementos construtivos ficam identificados, mas fora do total.
          </p>
        </div>

        {/* Live Budget Progress Bar */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500">Orçamento informado pela cliente</span>
            <span className="font-mono text-slate-400">R$ {challenge.budgetMax.toLocaleString("pt-BR")}</span>
          </div>

          <div className="relative w-full h-4 bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, budgetRatio * 100)}%` }}
              className={`h-full transition-all duration-300 ${
                budget.isOverBudget ? "bg-rose-600" : budgetRatio > 0.85 ? "bg-amber-500" : "bg-emerald-600"
              }`}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              {budget.isOverBudget ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                  Orçamento Estourado!
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Dentro do orçamento máximo
                </span>
              )}
            </div>
            <span className="text-sm font-black text-slate-800 font-mono">
              Total utilizado: R$ {budget.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Costs Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 grid grid-cols-12 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            <div className="col-span-5">Especificação / Item</div>
            <div className="col-span-3 text-center">Fabricante / Fornecedor</div>
            <div className="col-span-2 text-center">Cálculo Área / Qtd</div>
            <div className="col-span-2 text-right">Preço</div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {/* 1. Surfaces (Materials) */}
            {appliedMaterials.floor && (
              <div className="px-4 py-3 grid grid-cols-12 items-center">
                <div className="col-span-5 font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" style={{ backgroundColor: appliedMaterials.floor.color }} />
                  <div>
                    <p>{appliedMaterials.floor.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Revestimento de Piso</p>
                  </div>
                </div>
                <div className="col-span-3 text-center text-slate-500">{appliedMaterials.floor.manufacturer}</div>
                <div className="col-span-2 text-center font-mono">{floorArea.toFixed(1)} m²</div>
                <div className="col-span-2 text-right font-mono text-[10px] font-bold text-slate-400">Fora do orçamento</div>
              </div>
            )}

            {/* Render walls if any material exists */}
            {["wallNorth", "wallSouth", "wallEast", "wallWest"].map((wallKey) => {
              const mat = (appliedMaterials as any)[wallKey] as Material | null;
              if (!mat) return null;
              
              const label = wallKey === "wallNorth" ? "Parede Norte" : wallKey === "wallSouth" ? "Parede Sul" : wallKey === "wallEast" ? "Parede Leste" : "Parede Oeste";
              const area = (wallKey === "wallNorth" || wallKey === "wallSouth") ? wallNorthArea : wallEastArea;
              const cost = area * mat.price;

              return (
                <div key={wallKey} className="px-4 py-3 grid grid-cols-12 items-center">
                  <div className="col-span-5 font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300" style={{ backgroundColor: mat.color }} />
                    <div>
                      <p>{mat.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{label}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-center text-slate-500">{mat.manufacturer}</div>
                  <div className="col-span-2 text-center font-mono">{area.toFixed(1)} m²</div>
                  <div className="col-span-2 text-right font-mono text-[10px] font-bold text-slate-400">Fora do orçamento</div>
                </div>
              );
            })}

            {designFee > 0 && (
              <div className="px-4 py-3 grid grid-cols-12 items-center bg-violet-50/40">
                <div className="col-span-8 font-bold text-slate-800">Honorários de Design de Interiores</div>
                <div className="col-span-2 text-center font-mono">1 serviço</div>
                <div className="col-span-2 text-right font-mono font-bold text-slate-700">R$ {designFee.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              </div>
            )}

            {/* 2. Furniture & Equipment list */}
            {placedObjects.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400">Nenhum mobiliário ou equipamento inserido no espaço ainda.</div>
            ) : (
              placedObjects.map((obj) => (
                <div key={obj.id} className="px-4 py-3 grid grid-cols-12 items-center group">
                  <div className="col-span-5 font-bold text-slate-800 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p>{obj.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{obj.category} • {obj.subcategory}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-center text-slate-500">{obj.manufacturer}</div>
                  <div className="col-span-2 text-center font-mono">1 un</div>
                  <div className="col-span-2 text-right font-mono font-bold text-slate-700 flex items-center justify-end gap-1">
                    <span>R$ {obj.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <button
                      onClick={() => handleSwapFinder(obj.id)}
                      title="Comparar alternativas de fornecedores"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded transition-colors cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Comparative Supplier Drawer & Swap Finder */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 text-white space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-emerald-400" />
          <div>
            <span className="text-xs text-slate-400 font-mono">Módulo 6 — BIM</span>
            <h4 className="text-sm font-bold text-slate-100">Comparador de Marcas</h4>
          </div>
        </div>

        {selectedSwapObjectId ? (
          (() => {
            const placedObj = placedObjects.find(o => o.id === selectedSwapObjectId);
            if (!placedObj) return null;
            const alts = getAlternativesFor(placedObj);

            return (
              <div className="space-y-4">
                <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Substituindo Item</span>
                  <h5 className="text-xs font-bold text-white mt-1">{placedObj.name}</h5>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                    <span className="text-slate-400">Preço atual:</span>
                    <span className="text-emerald-400 font-bold">R$ {placedObj.price.toLocaleString("pt-BR")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Alternativas de Fornecedores</h6>
                  {alts.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum fornecedor concorrente cadastrado nesta categoria.</p>
                  ) : (
                    alts.map((alt) => {
                      const diff = alt.price - placedObj.price;
                      const isCheaper = diff < 0;

                      return (
                        <div
                          key={alt.id}
                          className="border border-slate-800 bg-slate-800/40 p-3 rounded-xl hover:bg-slate-800 hover:border-slate-700 transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h5 className="text-xs font-bold text-white">{alt.name}</h5>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">Por: {alt.manufacturer}</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-white">R$ {alt.price.toLocaleString("pt-BR")}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1 text-[10px]">
                            <span className={`font-semibold font-mono flex items-center gap-0.5 ${isCheaper ? "text-emerald-400" : "text-amber-500"}`}>
                              <TrendingDown className="h-3 w-3" />
                              {isCheaper ? `Economia de R$ ${Math.abs(diff).toLocaleString("pt-BR")}` : `Acrescimo de R$ ${diff.toLocaleString("pt-BR")}`}
                            </span>

                            <button
                              onClick={() => swapObject(placedObj.id, alt.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded text-[10px] cursor-pointer transition-colors"
                            >
                              Trocar Marca
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="text-center py-10 space-y-3">
            <Package className="h-8 w-8 text-slate-700 mx-auto" />
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Clique no ícone de atualização <span className="text-emerald-400 inline-block"><RefreshCw className="h-3 w-3" /></span> na tabela de custos para analisar fornecedores alternativos, comparar preços e otimizar o orçamento total.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
