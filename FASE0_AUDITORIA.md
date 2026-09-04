# FASE 0 — AUDITORIA COMPLETA DO PROJETO EXISTENTE

Projeto: Escritório em Ação 360º
Base auditada: pacote recuperado até o marco histórico v151
Objetivo: diagnóstico técnico e plano incremental, sem migração destrutiva.

## A. DIAGNÓSTICO

O projeto atual é uma aplicação React + TypeScript + Vite servida por Express. A camada educacional possui uma base reutilizável relevante, porém a experiência chamada de 3D/360º não utiliza atualmente um motor 3D real. O componente `Walkthrough3D.tsx` renderiza uma cena em `<canvas>` 2D com projeção matemática própria. Não foram encontradas dependências Three.js, Babylon.js, React Three Fiber, WebGL direto, GLTF/GLB loaders ou Unreal no pacote auditado.

Conclusão principal: o problema de realismo não é apenas qualidade dos modelos. A arquitetura gráfica atual não possui pipeline para meshes, PBR, iluminação física, colisões tridimensionais, LODs ou assets GLB/GLTF. Por isso objetos especializados tendem a ser representados por formas desenhadas ou símbolos.

## B. INVENTÁRIO

### Tecnologias encontradas
- React 19
- TypeScript 5.8
- Vite 6
- Express 4
- Tailwind CSS 4
- lucide-react
- motion
- Google GenAI (`@google/genai`)
- localStorage/sessionStorage para vários estados locais

### Arquivos centrais
- `src/App.tsx` — orquestração principal, UI, estado, CAD, 2D, 3D/360, orçamento e navegação.
- `src/components/Walkthrough3D.tsx` — pseudo-3D em Canvas 2D.
- `src/components/RoomDesigner2D.tsx` — planta 2D/SVG e manipulação.
- `src/components/BriefingModule.tsx` — fluxo de briefing.
- `src/components/MediatorDashboard.tsx` — painel da mediadora.
- `src/components/BudgetModule.tsx` — módulo de orçamento legado/paralelo.
- `src/data.ts` — desafios, catálogo e materiais codificados em TypeScript.
- `src/types.ts` — tipos de domínio.
- `server.ts` — API Express e integração de IA.

### Funcionalidades encontradas
- acesso de estudante;
- acesso de mediadora;
- ativar/desativar simulação;
- desafios/casos;
- briefing e conversa;
- catálogo;
- inserção e manipulação de objetos;
- planta 2D;
- desenho de paredes e geometrias;
- medições e overlays de acessibilidade;
- pseudo walkthrough 3D;
- modo 360º baseado no mesmo renderer atual;
- materiais por superfície;
- orçamento;
- honorários no fluxo principal recuperado;
- versões/layouts locais;
- feedback/avaliação com IA;
- painel da mediadora;
- persistência parcial em storage.

## C. PROBLEMAS

### P0 — Bloqueadores de realismo
1. **Não há motor 3D real.** O renderer atual é Canvas 2D.
2. **Não há pipeline de assets 3D.** Nenhum GLB/GLTF/FBX/USD é carregado.
3. **Não há PBR real.** Os materiais atuais são principalmente cor/metadados.
4. **Não há iluminação 3D física.** Não existem luzes, sombras, GI/reflexos reais de engine.
5. **Não há sistema tridimensional de colisão.**
6. **Objetos especializados não têm geometria própria suficiente para reconhecimento visual.**

### P1 — Arquitetura/manutenção
1. `App.tsx` tem ~3.7 mil linhas e concentra responsabilidades demais.
2. Há lógica de orçamento duplicada em `App.tsx` e `BudgetModule.tsx`.
3. `BudgetModule.tsx` ainda soma superfícies de piso/parede enquanto a regra recuperada do projeto mudou; risco de divergência.
4. Catálogo e materiais estão presos em `src/data.ts`; crescimento para centenas de assets exigiria edição de código.
5. Persistência é fragmentada em várias chaves de localStorage/sessionStorage.
6. Credenciais de acesso ficam no navegador; adequado apenas para protótipo educacional local, não para autenticação real.
7. Dependência de Google GenAI para recursos de IA no servidor.

### P1 — 360º
- O modo 360º atual reutiliza o renderer existente; não é câmera 360 sobre geometria 3D real.
- Risco de chamar de “360º” uma experiência que visualmente não possui a fidelidade esperada.

### P1 — Materioteca
- Catálogo recuperado no código possui quantidade muito menor que a lista histórica da auditoria.
- A lista posterior contém centenas de itens e variações que não estão representados como assets 3D reais no pacote.
- Portas/janelas/pisos gerados em série precisam ser tratados como sistemas paramétricos/data-driven, não centenas de objetos codificados manualmente.

### P2 — UX/responsividade
- Muitos controles e estados coexistem no mesmo componente principal.
- Há risco de sobreposição/menus apertados em telas menores.
- O modo 3D deve priorizar cena e painéis recolhíveis.

### P2 — autoria/licenças
- O pacote usa bibliotecas de terceiros e Google Fonts/IA em versões anteriores.
- Bibliotecas open source não são “plágio”, mas precisam de governança de licença.
- Ainda não há inventário formal completo `ASSET_LICENSES.md` para modelos, texturas, fontes e plugins.

## D. REAPROVEITAMENTO

### MANTER
- identidade e narrativa do projeto;
- fluxo educacional;
- casos/desafios;
- briefing;
- cliente virtual e memória de requisitos;
- orçamento conceitual;
- gamificação;
- painel da mediadora;
- progressão sem bloqueio pedagógico;
- regras de acessibilidade;
- planta 2D como ferramenta técnica;
- estrutura de tipos de objetos/preços/dimensões como ponto de partida;
- API e contratos educacionais, após desacoplamento.

### REFATORAR
- `App.tsx` em módulos/serviços menores;
- orçamento para um único motor de cálculo;
- persistência para estado de projeto unificado;
- catálogo de TypeScript hardcoded para dados externos/data-driven;
- autenticação se houver uso real multiusuário;
- regras de posicionamento/snap em serviço próprio;
- cliente/IA para separar domínio pedagógico do provedor de IA.

### SUBSTITUIR
- renderer pseudo-3D atual como renderer principal da Prática 360º;
- formas genéricas de equipamentos/móveis críticos;
- materiais apenas por cor quando a experiência exigir realismo.

### INTEGRAR
- web educacional ↔ renderer 3D;
- catálogo ↔ assets 3D ↔ orçamento;
- briefing ↔ regras de avaliação espacial;
- projeto salvo ↔ posições/rotações/materiais do ambiente 3D.

### CRIAR
- schema de AssetDefinition;
- registry de assets;
- pipeline GLB/GLTF para web e/ou Unreal;
- master materials/PBR;
- sistema de colisão/placement;
- níveis gráficos/fallback;
- auditoria visual automatizável;
- documentação de licenças;
- camada de integração Web/Unreal.

## E. MIGRAÇÃO — O QUE DEVE IR PARA UNREAL/3D AVANÇADO

Candidatos fortes:
- ambiente arquitetônico navegável;
- móveis detalhados;
- equipamentos clínicos/audiológicos/odontológicos;
- vegetação/paisagismo;
- iluminação física;
- sombras/reflexos;
- materiais PBR;
- primeira pessoa/câmera 360;
- colisões e inspeção espacial.

Não migrar automaticamente a UI educacional inteira.

## F. WEB — O QUE DEVE PERMANECER

- autenticação/perfil;
- seleção de caso;
- dossiê;
- briefing/conversa;
- orçamento e relatórios;
- materioteca como catálogo/gestão;
- ranking/gamificação;
- feedback;
- painel da mediadora;
- configurações;
- acessibilidade textual;
- fallback para dispositivos sem suporte avançado.

## G. INTEGRAÇÃO PROPOSTA

Arquitetura incremental recomendada:

1. **Web Core** — mantém domínio educacional e UI.
2. **Project State Service** — estado canônico do projeto (objetos, posição, rotação, material, preço, sala).
3. **Asset Registry** — metadados dos assets, thumbnails, arquivos e licenças.
4. **Renderer Adapter** — contrato único para um renderer 3D.
5. **Renderer Web 3D** — prova de conceito local com GLB/GLTF e PBR.
6. **Unreal Adapter / Pixel Streaming** — opção de alta fidelidade para hardware/infra adequados.
7. **Fallback 360** — mantém a atividade acessível em dispositivos limitados.

O Web Core não deve conhecer detalhes internos do Unreal. Ele envia/recebe estado de projeto por contratos de dados.

## H. PROVA DE CONCEITO

Ambiente recomendado: **Escritório da Designer**.

Escopo mínimo:
- sala com dimensões reais;
- piso, paredes, teto, porta e janela;
- mesa de trabalho;
- cadeira operacional;
- dois monitores/computador;
- armário/estante;
- tapete;
- planta;
- luminária de piso;
- objeto decorativo;
- materiais PBR;
- câmera humana + órbita/360;
- seleção/mover/girar;
- colisão básica;
- catálogo mínimo;
- orçamento integrado;
- salvar/restaurar posições;
- painel recolhível.

Critério: nenhum dos objetos principais pode ser um cubo renomeado.

## I. ROADMAP

1. Fase 0 — auditoria e documentação (esta etapa).
2. Criar checkpoint/repositório próprio do projeto.
3. Extrair domínio de assets e orçamento do `App.tsx`.
4. Criar schema data-driven de assets.
5. Implementar prova de conceito Web 3D para validar contratos e UX.
6. Validar 10–12 assets do Escritório da Designer.
7. Testar salvamento, orçamento, acessibilidade e responsividade.
8. Medir performance em notebook/celular.
9. Prototipar Unreal somente após contratos estabilizados.
10. Comparar Web 3D vs Unreal/Pixel Streaming por custo, latência, qualidade e manutenção.
11. Expandir Materioteca por lotes auditados.
12. Migrar equipamentos especializados somente com modelos reconhecíveis.

## J. RISCOS

- Pixel Streaming possui custo de GPU/servidor e concorrência por usuário.
- Unreal em navegador exige infraestrutura; não é substituto direto de uma SPA leve.
- fotorrealismo extremo pode prejudicar celulares/notebooks educacionais.
- centenas de assets 3D exigem pipeline, não edição manual de código.
- modelos/texturas sem licença clara criam risco jurídico.
- IA externa cria dependência de provedor/custo/chave.
- sem fonte única de estado, Web e Unreal podem divergir.
- alterações massivas antes da prova de conceito aumentariam risco de regressão.

## TESTES EXECUTADOS NESTA FASE

### Confirmado por inspeção estática
- estrutura de arquivos;
- dependências declaradas;
- ausência de Three.js/WebGL/GLTF/GLB no código recuperado;
- renderer Canvas 2D em `Walkthrough3D.tsx`;
- endpoints do servidor;
- chaves de storage;
- duplicação de lógica de orçamento;
- catálogo atual codificado em TypeScript.

### Não concluído
- build completo: instalação npm não concluiu no ambiente dentro do limite disponível;
- teste visual no navegador local;
- Unreal Engine: não há projeto `.uproject` nem engine neste pacote;
- validação de modelos 3D: não existem modelos 3D no pacote auditado.

## DECISÃO DA FASE 0

**NÃO migrar tudo para Unreal agora.**

A próxima mudança segura é criar a camada data-driven/renderer adapter e uma única prova de conceito do Escritório da Designer. Somente após demonstrar escala, PBR, interação, orçamento, salvamento e performance deve-se decidir o quanto da camada espacial irá para Unreal.
