# Escritório em Ação 360 — Recuperação consolidada até o marco v151

Este pacote foi reconstruído a partir do ZIP-base exportado, dos registros das conversas JOGO / Analisar jogo educativo e dos materiais salvos na Biblioteca.

## Confirmado nos registros posteriores ao ZIP

- v148: orçamento disponível informado pela cliente, valor utilizado, saldo, percentual, alerta de excesso e valor excedido.
- v148: paredes, portas, janelas, piso e telhado não entram na soma do orçamento de Design de Interiores.
- v149: luminárias de teto/parede removidas temporariamente; luminária de piso mantida; Prática 360 ampliada.
- v151: escritório panorâmico em tela inteira; quatro pontos interativos; retirada da opção separada “Visita 360º”; início da auditoria individual dos objetos.
- A prática deve iniciar sem mobiliário/equipamentos previamente colocados.
- Planta técnica e Modelo realista devem aparecer junto do título Prática 360º, sem duplicação do nome.
- A biblioteca precisa de rolagem e os painéis laterais não podem ser esmagados por mudanças de dimensão do ambiente.
- O comando de voz da Prática 360º foi posteriormente solicitado para remoção.
- As escolhas reais de móveis, objetos e equipamentos feitas na Prática 360º devem alimentar apresentação/moodboard; não deve existir uma Curadoria paralela obrigatória.
- A etapa de apresentação ao cliente é penúltima; presente/entrega, medalha, ranking e feedback vêm ao final da sequência.
- Gato/pet sem função pedagógica foi solicitado para remoção.
- Erros pedagógicos não devem bloquear a continuidade; devem gerar ressalvas, consequências e feedback da Mediadora.
- Painel privado da Mediadora deve permitir ativar/desativar a dinâmica, acompanhar ranking/feedbacks, alterar acesso dos alunos e recomeçar a dinâmica.

## Mudanças efetivamente incorporadas neste código recuperado

1. Prática 360º em overlay de tela inteira usando o próprio ambiente 3D.
2. Login geral de aluno padrão `Prática 360` / `Todos`.
3. Login/senha de aluno configuráveis pelo painel da Mediadora.
4. Botão `Recomeçar dinâmica` no painel da Mediadora.
5. Nova sessão autenticada inicia com experiência limpa, sem herdar objetos/progresso do usuário anterior.
6. Mensagem de intervalo pedagógico quando a dinâmica está desativada.
7. Login privado da Mediadora restaurado conforme registro: `mediadorakeise` / `12345678`.
8. Comando de voz removido da Prática 360º.
9. Orçamento corrigido: soma itens inseridos + honorários; piso/parede/portas/janelas/telhado fora da soma.
10. Campo de honorários do Design de Interiores incluído no painel de orçamento.
11. Projeto continua iniciando com `placedObjects = []`.

## Recuperado como requisito, mas não reconstruído integralmente

- Renderização 3D individual e realista de toda a Materioteca.
- Auditoria visual completa dos mais de 1000 itens mencionados na conversa.
- Sol geográfico real por cidade, orientação e horário exato.
- Clima real automático.
- Moodboard/apresentação final plenamente vinculados a todas as escolhas da Prática 360º.
- Fluxo narrativo completo das 34 etapas com todos os eventos de caos e documentos.
- Ranking e feedback realmente multiusuário em tempo real (o código-base usa dados mock/local).
- Agendamento servidor-side real de ativação/desativação por data/hora.
- Reprodução bit a bit da versão hospedada v151, pois o código-fonte do checkpoint da habilidade Sites não foi exportado para a Biblioteca.

## Critério para a auditoria de objetos v151+

Um item só é considerado aprovado se, sem o nome visível, ainda for reconhecível pelo formato, escala, materiais, componentes, instalação e função. Objetos de parede devem permitir parede/posição/altura quando aplicável. Itens redundantes que podem ser compostos pelo aluno devem ser removidos em vez de virar objetos específicos.
