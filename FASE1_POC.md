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
- Renderer Three.js: iniciado.
- Asset Registry: iniciado.
- 9 assets POC próprios: gerados localmente para validação técnica; NÃO aprovados como fotorrealistas finais.
- Build completo: pendente de ambiente com instalação npm funcional.
- Unreal: planejado, ainda não implementado.

## Próximas tarefas
1. Subir a base recuperada completa para a branch.
2. Validar compilação com Three.js/GLTFLoader/OrbitControls.
3. Unificar Budget Engine.
4. Extrair Project State Service.
5. Testar mover/girar por mouse e teclado.
6. Implementar colisão/limites da sala.
7. Auditar visualmente cada asset da POC.
8. Só então iniciar equipamentos especializados da Materioteca.
