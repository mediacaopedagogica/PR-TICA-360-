import React, { useState } from "react";
import { Challenge, CatalogObject, StudentProgress, CourseType } from "../types";
import { CATALOG_OBJECTS, MOCK_STUDENT_PROGRESS } from "../data";
import { 
  Settings2, Plus, Users, ClipboardList, BookOpen, 
  Trash2, PlusCircle, Radio, Award, Trophy, Play, Pause, Calendar
} from "lucide-react";

interface MediatorDashboardProps {
  challenges: Challenge[];
  onAddChallenge: (ch: Challenge) => void;
  onRemoveChallenge: (id: string) => void;
  onUpdateChallenge: (id: string, updated: Partial<Challenge>) => void;
  isSimulationActive: boolean;
  onToggleSimulationActive: (active: boolean) => void;
  studentAccessLogin: string;
  studentAccessPassword: string;
  onUpdateStudentAccess: (login: string, password: string) => void;
  onResetStudentProgress: () => void;
}

export const MediatorDashboard: React.FC<MediatorDashboardProps> = ({
  challenges,
  onAddChallenge,
  onRemoveChallenge,
  onUpdateChallenge,
  isSimulationActive,
  onToggleSimulationActive,
  studentAccessLogin,
  studentAccessPassword,
  onUpdateStudentAccess,
  onResetStudentProgress,
}) => {
  const [activeTab, setActiveTab] = useState<"challenges" | "students" | "catalog">("challenges");
  const [studentLoginDraft, setStudentLoginDraft] = useState(studentAccessLogin);
  const [studentPasswordDraft, setStudentPasswordDraft] = useState(studentAccessPassword);

  // State for creating a new challenge
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newPersonality, setNewPersonality] = useState("");
  const [newBudget, setNewBudget] = useState(20000);
  const [newArea, setNewArea] = useState(15);
  const [newCourse, setNewCourse] = useState<CourseType>(CourseType.INTERIORS);

  // State for registering custom objects
  const [customCatalog, setCustomCatalog] = useState<CatalogObject[]>(CATALOG_OBJECTS);
  const [newObjName, setNewObjName] = useState("");
  const [newObjCat, setNewObjCat] = useState<"Residencial" | "Clínicas" | "Comercial" | "Equipamentos">("Residencial");
  const [newObjSub, setNewObjSub] = useState("");
  const [newObjW, setNewObjW] = useState(1.0);
  const [newObjD, setNewObjD] = useState(1.0);
  const [newObjH, setNewObjH] = useState(1.0);
  const [newObjPrice, setNewObjPrice] = useState(500);
  const [newObjMan, setNewObjMan] = useState("Fabricante Local");

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newClient) return;

    const newCh: Challenge = {
      id: `ch-custom-${Date.now()}`,
      course: newCourse,
      title: newTitle,
      description: newDesc,
      clientName: newClient,
      clientRole: "Cliente Criado pelo Mediador",
      clientPersonality: newPersonality || "Colaborativo",
      clientAvatar: "👤",
      budgetMax: newBudget,
      minArea: newArea,
      requiredObjects: [],
      rubric: {
        circulation: "Circulação desimpedida e confortável.",
        ergonomics: "Mobiliário adequado às funções ergonômicas.",
        sustainability: "Materiais ecológicos ou recicláveis.",
        accessibility: "Giro de cadeira de rodas livre."
      },
      unlocked: true
    };

    onAddChallenge(newCh);
    setNewTitle("");
    setNewDesc("");
    setNewClient("");
    setNewPersonality("");
  };

  const handleCreateObject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjName) return;

    const newObj: CatalogObject = {
      id: `obj-custom-${Date.now()}`,
      name: newObjName,
      category: newObjCat,
      subcategory: newObjSub || "Geral",
      width: newObjW,
      depth: newObjD,
      height: newObjH,
      price: newObjPrice,
      weight: 15,
      material: "MDF / Aço",
      manufacturer: newObjMan,
      sustainability: "Selo Eco-Responsável local.",
      accessibility: "Dimensões acessíveis.",
      norms: "NBR de mobiliário geral.",
      svgIcon: "chair"
    };

    setCustomCatalog([newObj, ...customCatalog]);
    setNewObjName("");
    setNewObjSub("");
  };

  // Sort student mock progress to create a real-time leaderboard
  const rankedStudents = [...MOCK_STUDENT_PROGRESS].sort((a, b) => b.lastScore - a.lastScore);

  return (
    <div className="bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] text-slate-100">
      
      {/* Dynamic Simulation Control Banner (Full Width Top Header) */}
      <div className="col-span-12 bg-slate-900/80 border-b border-slate-850 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-3.5 w-3.5">
            {isSimulationActive ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-wide uppercase font-mono text-white">Status do Servidor de Jogo</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isSimulationActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {isSimulationActive ? "ATIVADO" : "PAUSADO / INATIVO"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Controlador mestre de acesso dos alunos aos laboratórios práticos</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="text-[9px] uppercase font-mono text-slate-500 font-bold">
              Login dos alunos
              <input value={studentLoginDraft} onChange={(e) => setStudentLoginDraft(e.target.value)} className="mt-1 w-full min-w-[150px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white normal-case font-sans" />
            </label>
            <label className="text-[9px] uppercase font-mono text-slate-500 font-bold">
              Senha dos alunos
              <input value={studentPasswordDraft} onChange={(e) => setStudentPasswordDraft(e.target.value)} className="mt-1 w-full min-w-[140px] bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white normal-case font-sans" />
            </label>
          </div>
          <button onClick={() => onUpdateStudentAccess(studentLoginDraft, studentPasswordDraft)} className="px-3 py-2.5 rounded-xl text-[10px] font-black bg-purple-600 hover:bg-purple-500 text-white">Salvar acesso</button>
          <button onClick={onResetStudentProgress} className="px-3 py-2.5 rounded-xl text-[10px] font-black bg-amber-600 hover:bg-amber-500 text-white">Recomeçar dinâmica</button>
          <button
            onClick={() => onToggleSimulationActive(!isSimulationActive)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              isSimulationActive
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/20"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20"
            }`}
          >
            {isSimulationActive ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>Bloquear Acesso</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Ativar Simulação</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Side Tabs Navigation */}
      <div className="md:col-span-3 bg-slate-950 border-r border-slate-900 p-5 space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Settings2 className="h-4 w-4 text-purple-400 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <span className="text-[9px] text-purple-400 font-mono tracking-wider font-extrabold uppercase block">Painel Administrativo</span>
              <h4 className="text-xs font-bold text-white font-sans">Mediador Pedagógico</h4>
            </div>
          </div>

          <div className="space-y-1.5 pt-4">
            <button
              onClick={() => setActiveTab("challenges")}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                activeTab === "challenges"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Casos de Estudo</span>
            </button>

            <button
              onClick={() => setActiveTab("students")}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                activeTab === "students"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Ranking Real-Time</span>
            </button>

            <button
              onClick={() => setActiveTab("catalog")}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all ${
                activeTab === "catalog"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              <span>Biblioteca BIM</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-3 text-[10px] text-slate-500 space-y-1 font-mono">
          <p className="font-bold text-slate-400">⚡ CENTRAL DO MEDIADOR</p>
          <p>Login privado: mediadorakeise</p>
          <p>Tipo de Conexão: Local Encapsulado</p>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="md:col-span-9 p-6 bg-slate-900/20">
        
        {/* TAB 1: Gerenciar Desafios */}
        {activeTab === "challenges" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-bold text-white">Criar Novo Caso de Estudo</h3>
              <p className="text-xs text-slate-400 mt-1">Desenvolva desafios clínicos ou de interiores personalizados. Os alunos receberão novos clientes automaticamente ao reiniciar o jogo.</p>
            </div>

            <form onSubmit={handleCreateChallenge} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-5 border border-slate-800 rounded-xl shadow-lg">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Título do Caso Clínico / Desafio</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Consultório de Neurologia Infantil, Living com Biofilia..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Área Prática / Curso</label>
                <select
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value as CourseType)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                >
                  {Object.values(CourseType).map((co) => (
                    <option key={co} value={co}>{co}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Nome do Cliente Virtual</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Paulo, Família Alencar..."
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Briefing & Necessidades do Caso</label>
                <textarea
                  required
                  placeholder="Quais as dores, limitações clínicas, rotinas ou especificidades que a IA deve simular e cobrar na avaliação?"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium h-20 mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Limite de Verba (R$)</label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(parseInt(e.target.value) || 10000)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Área Mínima Requerida (m²)</label>
                <input
                  type="number"
                  value={newArea}
                  onChange={(e) => setNewArea(parseInt(e.target.value) || 10)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Publicar Caso na Rota Ativa</span>
                </button>
              </div>
            </form>

            {/* List of active challenges */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Casos Cadastrados no Sistema ({challenges.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {challenges.map((ch) => (
                  <div key={ch.id} className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col justify-between shadow-md relative">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-900/30">
                          {ch.course}
                        </span>
                        <button
                          onClick={() => onRemoveChallenge(ch.id)}
                          className="text-slate-500 hover:text-rose-500 p-1 rounded hover:bg-rose-950/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-2">{ch.title}</h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">{ch.description}</p>
                    </div>

                    <div className="border-t border-slate-850 mt-4 pt-2 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Orçamento Máx: R$ {ch.budgetMax.toLocaleString("pt-BR")}</span>
                      <span className="text-emerald-400 font-bold">Cliente: {ch.clientName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Acompanhar Alunos / Ranking Real-Time */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-md font-bold text-white">Ranking e Telemetria em Tempo Real</h3>
                <p className="text-xs text-slate-400 mt-1">Posicionamento atual dos estudantes da turma com base na avaliação do mestre de IA.</p>
              </div>
              <div className="bg-emerald-950/40 border border-emerald-900/30 rounded-xl px-3 py-1.5 flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Sincronização Ativa</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Média Geral</span>
                  <span className="text-md font-black text-white font-mono">8.0 / 10</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Total de Ativos</span>
                  <span className="text-md font-black text-white font-mono">4 Alunos</span>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block uppercase">Status de Rede</span>
                  <span className="text-md font-black text-emerald-400 font-mono">Imersivo OK</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-slate-900 border-b border-slate-850 px-4 py-3 grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center font-mono">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4 text-left">Aluno(a)</div>
                <div className="col-span-3 text-left">Desafio</div>
                <div className="col-span-2">Orçamento</div>
                <div className="col-span-2">Pontuação IA</div>
              </div>

              <div className="divide-y divide-slate-850 text-xs text-slate-300">
                {rankedStudents.map((st, idx) => {
                  let badge = <span className="text-slate-500 font-mono font-bold text-xs">#{idx + 1}</span>;
                  if (idx === 0) badge = <span className="text-lg">🥇</span>;
                  if (idx === 1) badge = <span className="text-lg">🥈</span>;
                  if (idx === 2) badge = <span className="text-lg">🥉</span>;

                  return (
                    <div key={st.id} className="px-4 py-4 grid grid-cols-12 items-center text-center hover:bg-slate-900/20 transition-all">
                      <div className="col-span-1 flex justify-center">{badge}</div>
                      <div className="col-span-4 text-left flex items-center gap-2.5">
                        <span className="text-lg bg-slate-900 p-1.5 rounded-lg border border-slate-800">{st.avatar}</span>
                        <div>
                          <p className="font-bold text-white text-xs">{st.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{st.course}</p>
                        </div>
                      </div>
                      <div className="col-span-3 text-left">
                        <p className="font-medium text-slate-300 truncate">{st.challengeTitle}</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-0.5">Visto: {st.lastActive}</p>
                      </div>
                      <div className="col-span-2">
                        {st.budgetStatus === "ok" ? (
                          <span className="text-emerald-400 font-bold font-mono text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/20">DENTRO DA VERBA</span>
                        ) : (
                          <span className="text-rose-400 font-bold font-mono text-[10px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/20">ESTOURADO</span>
                        )}
                      </div>
                      <div className="col-span-2">
                        <span className={`font-mono font-black text-xs px-2.5 py-1 rounded-lg border ${
                          st.lastScore >= 8.5
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/30"
                            : "bg-amber-950/40 text-amber-400 border-amber-900/30"
                        }`}>
                          {st.lastScore.toFixed(1)} / 10
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Biblioteca & Fornecedores */}
        {activeTab === "catalog" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-bold text-white">Biblioteca Geral BIM</h3>
              <p className="text-xs text-slate-400 mt-1">Injete novos itens e blocos estruturais que estarão imediatamente disponíveis aos alunos na etapa de design.</p>
            </div>

            <form onSubmit={handleCreateObject} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-5 border border-slate-800 rounded-xl shadow-lg">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Nome do Objeto</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cadeira Ergonômica de Rodas, Maca Hidráulica..."
                  value={newObjName}
                  onChange={(e) => setNewObjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Categoria Geral</label>
                <select
                  value={newObjCat}
                  onChange={(e: any) => setNewObjCat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                >
                  <option value="Residencial">Residencial</option>
                  <option value="Clínicas">Clínicas</option>
                  <option value="Equipamentos">Equipamentos</option>
                  <option value="Comercial">Comercial</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Tags de Subcategoria</label>
                <input
                  type="text"
                  placeholder="Ex: Consultórios, Apoio, Sala..."
                  value={newObjSub}
                  onChange={(e) => setNewObjSub(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase">L (Largura m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newObjW}
                    onChange={(e) => setNewObjW(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-medium mt-1 focus:border-purple-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase">P (Profundidade m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newObjD}
                    onChange={(e) => setNewObjD(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-medium mt-1 focus:border-purple-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-slate-500 uppercase">A (Altura m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={newObjH}
                    onChange={(e) => setNewObjH(parseFloat(e.target.value) || 1.0)}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2 font-medium mt-1 focus:border-purple-500 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Preço Estimado (R$)</label>
                <input
                  type="number"
                  value={newObjPrice}
                  onChange={(e) => setNewObjPrice(parseInt(e.target.value) || 100)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">Fabricante</label>
                <input
                  type="text"
                  value={newObjMan}
                  onChange={(e) => setNewObjMan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 font-medium mt-1 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Cadastrar Estrutura BIM</span>
                </button>
              </div>
            </form>

            {/* List of custom items */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">Itens Disponíveis na Biblioteca ({customCatalog.length})</h4>
              <div className="max-h-[300px] overflow-y-auto border border-slate-850 rounded-xl bg-slate-900/20 divide-y divide-slate-850 scrollbar-thin">
                {customCatalog.map((item) => (
                  <div key={item.id} className="px-4 py-3.5 flex items-center justify-between text-xs hover:bg-slate-900/40">
                    <div>
                      <h5 className="font-bold text-white">{item.name}</h5>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {item.category} • {item.subcategory} • Fornecedor: {item.manufacturer}
                      </span>
                    </div>
                    <div className="text-right font-mono font-bold text-purple-400">
                      R$ {item.price.toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
