import React, { useState, useRef, useEffect } from "react";
import { Challenge, BriefingMessage, CourseType } from "../types";
import { MessageSquare, Send, CheckCircle2, User, Landmark, ShieldCheck, HelpCircle } from "lucide-react";

interface BriefingModuleProps {
  challenge: Challenge;
  course: CourseType;
  messages: BriefingMessage[];
  onAddMessage: (msg: BriefingMessage) => void;
  onCompleteBriefing: () => void;
  isBriefingCompleted: boolean;
}

export const BriefingModule: React.FC<BriefingModuleProps> = ({
  challenge,
  course,
  messages,
  onAddMessage,
  onCompleteBriefing,
  isBriefingCompleted,
}) => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const studentMsg: BriefingMessage = {
      id: `msg-${Date.now()}-student`,
      sender: "student",
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onAddMessage(studentMsg);
    setInputText("");
    setLoading(true);

    try {
      // Calling Express backend proxy
      const response = await fetch("/api/briefing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: studentMsg.text,
          history: messages,
          course: course,
          challenge: challenge,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao contatar servidor de simulação de cliente.");
      }

      const data = await response.json();
      
      const clientMsg: BriefingMessage = {
        id: `msg-${Date.now()}-client`,
        sender: "client",
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      
      onAddMessage(clientMsg);
    } catch (err: any) {
      console.error(err);
      
      // Local fallback dialog simulation when key is missing or server error occurs
      setTimeout(() => {
        const fallbacks: { [key: string]: string[] } = {
          "Design de Interiores": [
            "Olá! Preciso que o meu espaço de home office seja muito bem iluminado, de preferência integrado com o estar mas sem que a mesa fique totalmente exposta a quem entra. Meu orçamento de R$ 15.000 é bem apertado, então prefiro móveis ecológicos de MDF de reflorestamento.",
            "Gostaria de acomodar de forma confortável pelo menos 4 pessoas no sofá ou poltronas para quando meus amigos me visitarem. A circulação é importante, por isso evite móveis muito profundos.",
            "Eu adoro plantas! A presença de plantas ajuda muito no meu foco e bem-estar durante o trabalho em casa. Lâmpadas de LED quentes também dão aquele aconchego legal."
          ],
          "Fonoaudiologia": [
            "Olá, fonoaudiólogo. Para a minha clínica infantil, é imprescindível termos a cabine acústica portátil e o audiômetro bem instalados. A cabine precisa ter uma distância segura de passagem para carrinhos de bebê e cadeirantes.",
            "Para as crianças, precisamos de mesas e cadeiras adaptadas, sem cantos afiados. Elas se distraem muito fácil, então colocar o canto de terapia longe de distrações visuais seria excelente.",
            "Em relação ao orçamento de R$ 28.000, sei que os equipamentos acústicos são caros. Por isso, pesquise bem as opções para caber no valor limite."
          ],
          "Psicologia": [
            "Olá! Procuro um consultório muito acolhedor e com iluminação aconchegante indireta. Quero duas poltronas confortáveis posicionadas uma de frente para a outra, e um divã opcional. O isolamento de som é vital para que meus pacientes sintam sigilo absoluto.",
            "O orçamento é de R$ 18.000. Gosto de texturas suaves como veludo e camurça, e madeira clara. Nada que pareça uma sala de escritório fria de hospital.",
            "Excelente pergunta. A circulação deve ser suave, com pelo menos 80cm de distância entre as poltronas e a mesa de centro para que ninguém se sinta apertado ou invadido."
          ],
          "Fisioterapia": [
            "Olá. Para a sala de cinesioterapia escolar, a segurança é prioridade número um. A largura mínima de circulação deve ser de 1,20m para permitir passagem e manobra de cadeiras de rodas e andadores de reabilitação.",
            "O espaço deve conter a maca estofada, barras paralelas para treino de marcha e o espaldar fixado firmemente na parede de alvenaria. Piso vinílico antiderrapante de alta resistência é muito importante para evitar quedas.",
            "Temos um teto orçamentário de R$ 22.000. Por favor, certifique-se de que os materiais de fixação e as barras cumpram as especificações da NBR 9050."
          ]
        };

        const courseList = fallbacks[course] || [
          "Olá! Quero um ambiente funcional, bonito, que cumpra as regulamentações técnicas e que não ultrapasse o orçamento estipulado."
        ];
        const randomAnswer = courseList[Math.floor(Math.random() * courseList.length)];

        const clientMsg: BriefingMessage = {
          id: `msg-${Date.now()}-client`,
          sender: "client",
          text: randomAnswer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        onAddMessage(clientMsg);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Client Profile & Challenge Sheet */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl bg-slate-100 p-3 rounded-xl border border-slate-200">
            {challenge.clientAvatar}
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider">
              Cliente Virtual
            </span>
            <h3 className="text-xl font-bold font-sans text-slate-800 mt-1">
              {challenge.clientName}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {challenge.clientRole}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Personalidade e Perfil
            </h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {challenge.clientPersonality}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400">Verba Disponível</span>
              <span className="text-lg font-bold text-slate-800 font-mono mt-1">
                R$ {challenge.budgetMax.toLocaleString("pt-BR")}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400">Área Mínima</span>
              <span className="text-lg font-bold text-slate-800 font-mono mt-1">
                {challenge.minArea} m²
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Equipamentos / Móveis Obrigatórios
            </h4>
            <ul className="mt-2 space-y-1.5">
              {challenge.requiredObjects.map((objName, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{objName}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wide">
              <Landmark className="h-4 w-4" />
              <span>Instruções de Avaliação</span>
            </div>
            <p className="text-xs text-emerald-700 leading-relaxed">
              Entreviste o cliente simulado por chat antes de projetar. Pergunte sobre as preferências de circulação, ergonomia, acústica e sustentabilidade. Assim que extrair as informações necessárias, conclua o briefing e libere o Construtor de Ambientes.
            </p>
          </div>
        </div>

        {!isBriefingCompleted ? (
          <button
            onClick={onCompleteBriefing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm flex items-center justify-center gap-2 text-sm cursor-pointer transition-all hover:translate-y-[-1px]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Concluir Entrevista e Ir para o Projeto</span>
          </button>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">Briefing Concluído!</p>
              <p className="text-xs mt-0.5">O Construtor de Ambientes 2D/3D está desbloqueado.</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Interactive AI Interview Chat */}
      <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[520px]">
        {/* Chat Header */}
        <div className="bg-slate-850 px-5 py-4 border-b border-slate-850 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <div>
              <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider block">Canal de Comunicação</span>
              <h4 className="text-sm font-bold text-white leading-tight">Entrevista com o Cliente</h4>
            </div>
          </div>
        </div>

        {/* Chat Bubbles Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
              <span className="text-4xl">💬</span>
              <p className="text-slate-300 text-sm font-semibold">Inicie a conversação com o cliente</p>
              <p className="text-slate-500 text-xs max-w-sm">
                Pergunte sobre as preferências de mobiliário, limitações, normas técnicas aplicáveis ou orçamento. Digite algo abaixo!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isStudent = msg.sender === "student";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isStudent ? "justify-end" : "justify-start"}`}
                >
                  {!isStudent && (
                    <div className="text-xl bg-slate-800 p-1.5 rounded-lg border border-slate-700 flex-shrink-0">
                      {challenge.clientAvatar}
                    </div>
                  )}
                  <div className={`max-w-[80%] flex flex-col ${isStudent ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isStudent
                          ? "bg-emerald-600 text-white rounded-tr-none"
                          : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none whitespace-pre-wrap"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 px-1">
                      {isStudent ? "Você" : challenge.clientName} • {msg.timestamp}
                    </span>
                  </div>
                  {isStudent && (
                    <div className="bg-emerald-800/40 p-1.5 rounded-lg border border-emerald-700/50 flex-shrink-0">
                      <User className="h-4 w-4 text-emerald-400" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          {loading && (
            <div className="flex items-start gap-2.5 justify-start">
              <div className="text-xl bg-slate-800 p-1.5 rounded-lg border border-slate-700 animate-bounce">
                {challenge.clientAvatar}
              </div>
              <div className="bg-slate-800 text-slate-400 border border-slate-700 px-4 py-2.5 rounded-2xl rounded-tl-none text-xs font-mono flex items-center gap-2">
                <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping" />
                <span>{challenge.clientName} está pensando...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input Footer */}
        <form onSubmit={handleSendMessage} className="bg-slate-800 p-4 rounded-b-2xl border-t border-slate-700 flex gap-2.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isBriefingCompleted ? "Sinta-se livre para continuar conversando..." : "Pergunte ao cliente: Quais materiais você prefere? Qual o orçamento?"}
            disabled={loading}
            className="flex-1 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm border border-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white p-3 rounded-xl shadow-md cursor-pointer transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
