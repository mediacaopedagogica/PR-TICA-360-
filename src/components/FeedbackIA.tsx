import React, { useState } from "react";
import { PlacedObject, Material, Challenge, AIPedagogicalReview, PortfolioVersion, Wall } from "../types";
import { 
  Sparkles, Award, ClipboardCheck, Play, Save, History, 
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, RefreshCw 
} from "lucide-react";

interface FeedbackIAProps {
  challenge: Challenge;
  course: string;
  placedObjects: PlacedObject[];
  appliedMaterials: { floor: Material | null; wallNorth: Material | null; wallSouth: Material | null; wallEast: Material | null; wallWest: Material | null };
  roomDimensions: { width: number; depth: number; height: number };
  walls: Wall[];
  budgetSpent: number;
  review: AIPedagogicalReview | null;
  onUpdateReview: (review: AIPedagogicalReview) => void;
  portfolio: PortfolioVersion[];
  onSavePortfolio: (version: PortfolioVersion) => void;
}

export const FeedbackIA: React.FC<FeedbackIAProps> = ({
  challenge,
  course,
  placedObjects,
  appliedMaterials,
  roomDimensions,
  walls,
  budgetSpent,
  review,
  onUpdateReview,
  portfolio,
  onSavePortfolio,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<{ [key: string]: boolean }>({
    circulation: true,
    ergonomics: false,
    acoustic: false,
    accessibility: false,
    budget: false,
    sustainability: false,
    briefing: false,
  });

  const toggleTopic = (topic: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleRequestReview = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/analysis/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course,
          challenge,
          placedObjects,
          appliedMaterials,
          roomDimensions,
          walls,
          budgetSpent,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro de comunicação com o servidor de inteligência artificial.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      onUpdateReview(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Erro desconhecido ao gerar o feedback pedagógico."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToPortfolio = () => {
    if (!review) return;

    const version: PortfolioVersion = {
      id: `ver-${Date.now()}`,
      title: `Versão ${portfolio.length + 1}: ${review.scoreCirculation >= 8 ? "Otimizada" : "Ajustes de Circulação"}`,
      timestamp: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      placedObjects: [...placedObjects],
      appliedMaterials: { ...appliedMaterials },
      budgetSpent: budgetSpent,
      review: { ...review },
    };

    onSavePortfolio(version);
    setSuccessNotification("Portfólio atualizado! Layout salvo com sucesso.");
    setTimeout(() => {
      setSuccessNotification(null);
    }, 4000);
  };

  // Helper score color
  const getScoreColorClass = (score: number) => {
    if (score >= 8.5) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (score >= 6.0) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Review Trigger & Score Cards */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
              Módulo 5
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-1 font-sans">IA Pedagógica — Avaliação do Mediador</h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              A inteligência analisa em tempo real circulação, normas técnicas, ergonomia, acessibilidade universal e viabilidade econômica.
            </p>
          </div>

          <button
            onClick={handleRequestReview}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-xs font-sans tracking-tight cursor-pointer transition-all hover:translate-y-[-1px] shrink-0"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" />
            )}
            <span>{review ? "Atualizar Avaliação IA" : "Solicitar Parecer Técnico IA"}</span>
          </button>
        </div>

        {successNotification && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-xl p-4 flex items-center gap-2 text-xs font-semibold animate-pulse">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <span>{successNotification}</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center gap-2 text-xs">
            <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
            <div>
              <p className="font-bold">Aviso Técnico:</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* AI Scores Summary Circles */}
        {review ? (
          <div className="space-y-6">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                <Award className="h-4 w-4 text-emerald-600" />
                <span>Veredito Geral do Professor Mediador</span>
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed italic">
                "{review.generalVeredict}"
              </p>
            </div>

            {/* Score grids */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {[
                { name: "Circulação", val: review.scoreCirculation, tag: "circulation" },
                { name: "Ergonomia", val: review.scoreErgonomics, tag: "ergonomics" },
                { name: "Acústica/Luz", val: review.scoreAcousticLighting, tag: "acoustic" },
                { name: "Acessibil.", val: review.scoreAccessibility, tag: "accessibility" },
                { name: "Orçamento", val: review.scoreBudget, tag: "budget" },
                { name: "Sustentab.", val: review.scoreSustainability, tag: "sustainability" },
                { name: "Briefing", val: review.scoreBriefingMatch, tag: "briefing" },
              ].map((item) => (
                <div
                  key={item.tag}
                  onClick={() => toggleTopic(item.tag)}
                  className={`border p-2.5 rounded-xl text-center cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between items-center h-[90px] ${getScoreColorClass(item.val)}`}
                >
                  <span className="text-[10px] font-bold tracking-tight block truncate w-full">{item.name}</span>
                  <span className="text-xl font-black block font-mono">{item.val}</span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Ver Parecer</span>
                </div>
              ))}
            </div>

            {/* Structured Feedback Folders */}
            <div className="space-y-3">
              {[
                { title: "Circulação & Passagem", fb: review.feedbackCirculation, tag: "circulation", note: review.scoreCirculation },
                { title: "Ergonomia & Disposição do Layout", fb: review.feedbackErgonomics, tag: "ergonomics", note: review.scoreErgonomics },
                { title: "Iluminação & Conforto Acústico", fb: review.feedbackAcousticLighting, tag: "acoustic", note: review.scoreAcousticLighting },
                { title: "Atendimento às Normas NBR 9050", fb: review.feedbackAccessibility, tag: "accessibility", note: review.scoreAccessibility },
                { title: "Viabilidade Orçamentária", fb: review.feedbackBudget, tag: "budget", note: review.scoreBudget },
                { title: "Escolha de Materiais & Pegada Ecológica", fb: review.feedbackSustainability, tag: "sustainability", note: review.scoreSustainability },
                { title: "Fidelidade ao Briefing do Cliente", fb: review.feedbackBriefingMatch, tag: "briefing", note: review.scoreBriefingMatch },
              ].map((topic) => {
                const isOpen = expandedTopics[topic.tag];
                return (
                  <div key={topic.tag} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => toggleTopic(topic.tag)}
                      className="w-full bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100/50 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${topic.note >= 8.5 ? "bg-emerald-500" : topic.note >= 6 ? "bg-amber-500" : "bg-rose-500"}`} />
                        <h4 className="text-xs font-bold text-slate-800">{topic.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="font-extrabold text-slate-500">Nota: {topic.note}/10</span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-white text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {topic.fb}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <Sparkles className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Seu projeto ainda não foi avaliado pelo mediador virtual nesta sessão. Clique no botão de solicitação acima para enviar seu layout 2D/3D e receber notas e críticas técnicas personalizadas instantaneamente.
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Recommendations & Portfolio Versioning */}
      <div className="lg:col-span-4 space-y-6">
        {/* Active Suggestions list */}
        {review && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 text-white space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="text-xs text-slate-400 font-mono">Lista de Pendências</span>
                <h4 className="text-sm font-bold text-slate-100">Dicas Práticas do Professor</h4>
              </div>
            </div>

            <ul className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
              {review.practicalRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs bg-slate-800/50 border border-slate-800 p-2.5 rounded-xl leading-relaxed">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
              <button
                onClick={handleSaveToPortfolio}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>Salvar no Portfólio de Versões</span>
              </button>
            </div>
          </div>
        )}

        {/* Saved Versions timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-800">Portfólio de Versões</h4>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            Acompanhe o seu histórico de desenvolvimento nesta tarefa. Salvar novas versões ajuda a documentar a sua evolução pedagógica.
          </p>

          <div className="divide-y divide-slate-100 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin">
            {portfolio.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Nenhuma versão arquivada neste portfólio.</p>
            ) : (
              portfolio.map((v) => (
                <div key={v.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800">{v.title}</h5>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{v.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-mono font-extrabold">
                      Score: {v.review ? `${v.review.scoreCirculation}/10` : "N/A"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
