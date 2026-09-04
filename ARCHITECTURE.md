# Arquitetura — estado auditado e direção proposta

## Atual
React/Vite -> App.tsx monolítico -> Canvas/SVG + pseudo-3D Canvas -> Express/Google GenAI -> localStorage/sessionStorage.

## Proposta incremental
Web Core
  -> Project State Service
  -> Asset Registry
  -> Budget Engine
  -> Renderer Adapter
       -> Web 3D (GLB/GLTF + PBR)
       -> Unreal/Pixel Streaming (alta fidelidade, opcional)
       -> Fallback 360
  -> Pedagogical Evaluation
  -> Mediator Dashboard

A aplicação web permanece fonte do fluxo educacional. A camada espacial recebe estado serializável e devolve interações/transformações.
