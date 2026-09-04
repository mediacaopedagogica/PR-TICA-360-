# CHANGELOG

## Fase 0 — Auditoria
- auditada a versão recuperada até o marco histórico v151;
- identificado que o 3D atual é Canvas 2D com projeção própria;
- identificada ausência de pipeline GLB/GLTF/PBR;
- identificada duplicação de lógica de orçamento;
- definida arquitetura incremental Web Core + Renderer Adapter;
- criada proposta de prova de conceito do Escritório da Designer;
- nenhuma migração destrutiva executada.

## Fase 1 — Manipulação espacial integrada
- recomposta a aplicação completa na branch de desenvolvimento;
- integrado renderer Three.js à Prática 360º em tela inteira;
- implementado mover e girar objetos diretamente no 3D;
- adicionados snap de 5 cm, limites e colisão básica;
- sincronizado 3D, planta 2D, Project State e autosave;
- unificado o cálculo legado de orçamento com o Budget Engine;
- validado TypeScript, build de produção e regras espaciais automatizadas.
