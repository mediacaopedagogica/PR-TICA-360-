# FASE 1 — Melhorias implementadas

## Implementado
- renderer Three.js separado do canvas antigo;
- GLB/GLTF via Asset Registry;
- assets ausentes não viram cubos silenciosos;
- navegação real por W/A/S/D e setas;
- câmera limitada ao perímetro da sala;
- seleção de objeto 3D conectada ao painel de propriedades;
- contorno discreto do objeto selecionado;
- colisão básica da câmera com os volumes dos móveis carregados;
- materiais procedurais próprios para madeira/laminado, cerâmica/porcelanato e paredes;
- tone mapping ACES, sombras suaves e iluminação direcional/hemisférica;
- Budget Engine único: itens + honorários; paredes, portas, janelas, piso e cobertura fora do total atual;
- Project State versionado com snapshot em localStorage;
- restauração de snapshot por caso quando existente;
- reset da dinâmica limpa os snapshots;
- FPS aleatório removido e substituído por medição real via requestAnimationFrame;
- rotação automática obsoleta do antigo 360 removida.

## Verificação realizada
- transpile/sintaxe de 16 arquivos TS/TSX: 0 erros de sintaxe.

## Ainda não validado
- build completo com dependências instaladas;
- execução visual em navegador real nesta sessão;
- qualidade fotorrealista final dos GLBs POC;
- Unreal Engine/Pixel Streaming;
- colisão física avançada e manipulação direta de móveis no 3D.

## Próximas melhorias
1. mover/rotacionar objetos diretamente no 3D com snap e teclado;
2. sincronizar posição 3D -> Project State -> 2D -> orçamento;
3. unificar definitivamente o antigo BudgetModule com Budget Engine;
4. auditar e substituir os GLBs POC um por um;
5. iniciar cadeira operacional, mesa, estação de dois monitores e luminária de piso como assets definitivos;
6. depois avançar para equipamentos especializados: cabine acústica, audiômetro, imitanciômetro etc.
