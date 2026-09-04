# FASE 1 — Prova de Conceito 3D

## Ambiente
Escritório da Designer.

## Objetivo
Validar uma camada espacial 3D real antes de expandir a Materioteca inteira.

## Escopo inicial
- sala em escala real;
- piso, paredes e teto;
- porta e janela;
- mesa da designer;
- cadeira operacional;
- estação com dois monitores;
- armário/estante;
- tapete;
- planta;
- luminária de piso;
- câmera humana e órbita/360;
- GLB/GLTF;
- sombras e tone mapping;
- catálogo ligado a dimensões e orçamento;
- salvamento/restauração;
- fallback preservado.

## Regra de qualidade
Nenhum asset especializado pode ser aprovado apenas porque recebeu um nome. Se o rótulo for ocultado, a geometria deve continuar permitindo reconhecer sua função.

## Status
- Base React recuperada: recomposta na branch.
- Renderer Three.js: integrado à aplicação.
- Asset Registry: integrado.
- 9 assets POC próprios: gerados localmente para validação técnica; NÃO aprovados como fotorrealistas finais.
- Mover/girar no 3D: implementado com mouse, teclado, snap, limites e colisão básica.
- Build completo: validado em 04/09/2026.
- Unreal: planejado, ainda não implementado.

## Próximas tarefas
1. Auditar visualmente cada asset da POC.
2. Substituir cadeira, mesa, estação com dois monitores e luminária de piso por modelos finais.
3. Validar responsividade e interação por toque em dispositivos reais.
4. Otimizar o carregamento do pacote 3D.
5. Só então iniciar equipamentos especializados da Materioteca.
