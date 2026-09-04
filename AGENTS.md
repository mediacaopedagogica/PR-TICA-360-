# AGENTS.md — Escritório em Ação 360º

## Regra principal
Nunca remover funcionalidades existentes aprovadas sem explicar claramente a razão e verificar dependências.

## Objetivo
Evoluir incrementalmente o simulador educacional de Design de Interiores, preservando seu domínio pedagógico enquanto a camada espacial passa a suportar 3D realista, assets reconhecíveis, escala real, PBR, acessibilidade e orçamento integrado.

## Princípios
- não recomeçar o projeto sem necessidade;
- não declarar sucesso sem teste;
- não substituir asset ausente por cubo silenciosamente;
- marcar placeholders explicitamente;
- arrastar não pode ser a única interação essencial;
- erro pedagógico não bloqueia a progressão;
- manter cliente, briefing, orçamento e projeto sincronizados;
- preservar responsividade e fallback;
- registrar origem/licença de cada asset.

## Arquitetura alvo
Web Core + Project State + Asset Registry + Renderer Adapter + Web3D/Unreal opcional + Fallback 360.

## Convenções de assets
Cada asset deve possuir ID, nome, categoria, dimensões reais, preço, arquivo 3D, thumbnail, materiais, tipo de suporte/ancoragem, colisão, licença e informação pedagógica.

## Qualidade visual
Se o nome do objeto for ocultado, um objeto especializado deve continuar reconhecível pela geometria e componentes visíveis.

## Mudanças grandes
Criar checkpoint/branch. Trabalhar por feature. Não alterar centenas de arquivos indiscriminadamente.
