# Integração Web ↔ Renderer 3D/Unreal

Contrato mínimo do estado de objeto:
- assetId
- projectId
- roomId
- position {x,y,z}
- rotation {x,y,z}
- scale {x,y,z}
- materialVariant
- price
- locked
- metadata pedagógica

A camada web controla caso, briefing, orçamento, progresso e avaliação. O renderer controla visualização espacial e manipulação física, sem duplicar regras de negócio.
