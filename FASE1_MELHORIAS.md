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
- aplicação React completa recomposta na branch, incluindo telas, servidor, estilos e assets POC;
- móveis podem ser arrastados diretamente na cena 3D;
- snap espacial de 5 cm, limites da sala e bloqueio de sobreposição entre itens sólidos;
- controles alternativos por botões, Shift + setas e Q/E, para não depender apenas do arraste;
- posição e rotação do 3D atualizam o mesmo Project State usado pela planta 2D e pelo autosave;
- itens travados no painel também ficam protegidos na cena 3D;
- itens ocultos no painel não são renderizados no 3D;
- BudgetModule legado passou a usar o mesmo Budget Engine e não soma piso ou paredes;
- corrigida a ordem de inicialização do limite orçamentário, que poderia interromper a tela.

## Verificação realizada
- `tsc --noEmit`: aprovado;
- build de produção Vite + servidor: aprovado;
- testes de snap, limites, rotação e colisão: aprovados.

## Ainda não validado
- execução visual em navegador real nesta sessão;
- qualidade fotorrealista final dos GLBs POC;
- Unreal Engine/Pixel Streaming;
- colisão física avançada com apoios verticais e montagem sobre superfícies.

## Próximas melhorias
1. auditar e substituir os GLBs POC um por um;
2. iniciar cadeira operacional, mesa, estação de dois monitores e luminária de piso como assets definitivos;
3. acrescentar regras de apoio em mesas, paredes e teto;
4. depois avançar para equipamentos especializados: cabine acústica, audiômetro, imitanciômetro etc.
