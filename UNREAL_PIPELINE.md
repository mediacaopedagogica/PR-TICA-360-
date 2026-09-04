# Unreal Pipeline — planejamento inicial

Ainda não há projeto Unreal no pacote auditado.

Se a prova de conceito justificar Unreal:
- criar projeto separado e versionado;
- usar Data Assets/Data Tables para catálogo;
- Blueprints reutilizáveis (`BP_InteractiveObject`, `BP_Furniture`, `BP_Equipment`);
- C++ somente onde houver benefício claro;
- Master Materials + Material Instances;
- importar assets com escala/pivot/UV/normals/collision auditados;
- estudar Pixel Streaming e custo por usuário antes de adotar em produção.
