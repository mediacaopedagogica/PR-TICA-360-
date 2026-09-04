import React from "react";
import { GraduationCap, Layers, Settings2 } from "lucide-react";

interface HeaderProps {
  mediatorMode: boolean;
  onToggleMediatorMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mediatorMode,
  onToggleMediatorMode,
}) => {
  return (
    <header className="bg-slate-950 text-white border-b border-slate-900 shadow-xl sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-md font-black font-sans tracking-tight flex items-center gap-1.5">
                Laboratório Prático <span className="text-emerald-400 font-extrabold text-[10px] bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">360°</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block tracking-wide uppercase">Simulação Realista Tridimensional</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-emerald-400 uppercase tracking-widest bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Espaço Imersivo</span>
            </div>

            {/* Divider */}
            <span className="h-6 w-px bg-slate-900" />

            {/* Student vs Mediator Toggle Button */}
            <button
              id="header-mediator-toggle"
              onClick={onToggleMediatorMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold font-sans tracking-tight transition-all duration-300 cursor-pointer ${
                mediatorMode
                  ? "bg-purple-600/10 border-purple-500/40 text-purple-200 hover:bg-purple-600/20"
                  : "bg-slate-900 border-slate-850 text-slate-300 hover:bg-slate-850 hover:border-slate-800"
              }`}
            >
              {mediatorMode ? (
                <>
                  <Settings2 className="h-3.5 w-3.5 text-purple-400" />
                  <span>Painel do Mediador</span>
                </>
              ) : (
                <>
                  <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Área do Aluno</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

