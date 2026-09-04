import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client to prevent startup crashes when API key is missing
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in your secrets or environment variables. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint: Check status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// REST API endpoint: Talk to the virtual client (briefing interview)
app.post("/api/briefing/chat", async (req, res) => {
  try {
    const { message, history, course, challenge } = req.body;
    const ai = getGeminiClient();

    // Setup persona for the client based on course & challenge
    const systemInstruction = `Você é uma pessoa real contratando um profissional. Incorpora o papel de forma 100% realista e humana.
O interlocutor está fazendo uma entrevista de briefing profissional com você para projetar seu espaço.
O desafio e perfil do projeto é: "${challenge.title}". Descrição do seu perfil/desejo: "${challenge.description}".
Seu nome é ${challenge.clientName || "Roberto"}. Sua personalidade de cliente é: ${challenge.clientPersonality || "colaborativo, detalhista e focado em qualidade"}.
DIRETRIZES DE DIÁLOGO CRÍTICAS:
1. Nunca diga ou admita que você é uma Inteligência Artificial, um modelo de linguagem, uma simulação ou um robô. Fale exatamente como um ser humano faria.
2. Seja extremamente fluído, natural, empático e realista no tom de voz. Evite jargões de robô ou listas estruturadas excessivamente formais.
3. Além de responder às perguntas, sempre faça perguntas de volta ao profissional, estimulando o diálogo contínuo (ex: "O que você acha disso?", "Você acha que essa cor combina?", "Acha que meu orçamento de R$ ${challenge.budgetMax} é realista para isso?").
4. Dê pistas sutis sobre o que você deseja apenas se as perguntas certas forem feitas. Seu limite de verba absoluto é R$ ${challenge.budgetMax}.`;

    // Reconstruct conversation format for gemini-3.5-flash
    const formattedContents = [
      ...history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const textResponse = response.text || "Sem resposta do cliente.";
    res.json({ response: textResponse });
  } catch (error: any) {
    console.error("Error in briefing chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// REST API endpoint: AI Pedagogical analysis of the design
app.post("/api/analysis/review", async (req, res) => {
  try {
    const {
      course,
      challenge,
      placedObjects,
      appliedMaterials,
      roomDimensions,
      walls,
      budgetSpent,
    } = req.body;

    const ai = getGeminiClient();

    const objectsSummary = placedObjects.map((obj: any) => 
      `- ${obj.name} (${obj.category}): L:${obj.width}m x P:${obj.depth}m. Posição X:${obj.x}m, Y:${obj.y}m. Fornecedor: ${obj.manufacturer}, Preço: R$${obj.price}`
    ).join("\n");

    const materialsSummary = Object.entries(appliedMaterials || {}).map(([surface, material]: any) =>
      `- ${surface}: ${material.name} (Material: ${material.material}, Preço: R$${material.price}/m²)`
    ).join("\n");

    const wallsSummary = (walls || []).map((wall: any) =>
      `- Parede Divisória: Início (${wall.x1.toFixed(2)}m, ${wall.y1.toFixed(2)}m) até Fim (${wall.x2.toFixed(2)}m, ${wall.y2.toFixed(2)}m), Espessura: ${(wall.thickness * 100).toFixed(0)}cm, Altura: ${wall.height}m`
    ).join("\n");

    const prompt = `Analise o projeto atual de um aluno do curso de ${course} para o desafio "${challenge.title}".
Dimensões do cômodo: Largura ${roomDimensions.width}m x Comprimento ${roomDimensions.depth}m. Altura das paredes: ${roomDimensions.height}m.
Orçamento total gasto pelo aluno: R$ ${budgetSpent} (Orçamento máximo permitido: R$ ${challenge.budgetMax}).

Mobiliários e equipamentos inseridos no espaço:
${objectsSummary || "Nenhum objeto inserido."}

Materiais aplicados nas superfícies:
${materialsSummary || "Nenhum material customizado aplicado."}

Paredes internas/divisórias construídas pelo aluno (arquitetura BIM):
${wallsSummary || "Nenhuma parede interna customizada construída."}

Realize uma avaliação pedagógica construtiva e realista, simulando um professor mediador experiente. Avalie os seguintes tópicos exatamente:
1. Circulação & Passagem (espaço mínimo recomendado entre móveis e paredes é de 0.60m a 0.80m, e 1.20m para acessibilidade de cadeira de rodas. Verifique se as paredes internas construídas pelo aluno criam barreiras ou dividem bem os ambientes).
2. Ergonomia & Layout (adequação das alturas e distâncias para o trabalho ou atividade).
3. Iluminação & Acústica (especialmente importante para Clínicas de Fonoaudiologia, Psicologia, etc. Avalie se as paredes divisórias ajudam no isolamento acústico dos consultórios).
4. Acessibilidade (atendimento às normas NBR 9050, rampas, portas de no mínimo 0.80m de vão, circulação livre).
5. Orçamento & Viabilidade (gasto está dentro do limite? Há fornecedores alternativos mais econômicos?).
6. Sustentabilidade & Escolha de Materiais (coerência dos materiais ecológicos ou durabilidade).
7. Coerência com o Briefing e o Caso Clínico (atendeu a todas as solicitações do cliente na entrevista?).

Dê notas de 0 a 10 para cada um dos tópicos acima, um feedback textual detalhado e pontual com dicas práticas de reposicionamento ("Mova o objeto X para longe do objeto Y para liberar circulação" ou "Ajuste a parede divisória para garantir mais espaço de atendimento") e um veredito geral amigável e encorajador.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é o Professor Mediador de uma plataforma BIM Educacional 360. Retorne uma resposta estruturada exclusivamente em formato JSON contendo notas de 0 a 10, comentários detalhados específicos e recomendações diretas para o projeto do aluno de acordo com os objetos posicionados e orçamento.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scoreCirculation: { type: Type.INTEGER, description: "Nota de 0 a 10 para Circulação e Passagem" },
            scoreErgonomics: { type: Type.INTEGER, description: "Nota de 0 a 10 para Ergonomia" },
            scoreAcousticLighting: { type: Type.INTEGER, description: "Nota de 0 a 10 para Acústica e Iluminação" },
            scoreAccessibility: { type: Type.INTEGER, description: "Nota de 0 a 10 para Acessibilidade" },
            scoreBudget: { type: Type.INTEGER, description: "Nota de 0 a 10 para Orçamento" },
            scoreSustainability: { type: Type.INTEGER, description: "Nota de 0 a 10 para Sustentabilidade" },
            scoreBriefingMatch: { type: Type.INTEGER, description: "Nota de 0 a 10 para Coerência com o Briefing" },
            
            feedbackCirculation: { type: Type.STRING, description: "Feedback detalhado sobre circulação" },
            feedbackErgonomics: { type: Type.STRING, description: "Feedback detalhado sobre ergonomia" },
            feedbackAcousticLighting: { type: Type.STRING, description: "Feedback detalhado sobre acústica e iluminação" },
            feedbackAccessibility: { type: Type.STRING, description: "Feedback detalhado sobre acessibilidade" },
            feedbackBudget: { type: Type.STRING, description: "Feedback detalhado sobre orçamento" },
            feedbackSustainability: { type: Type.STRING, description: "Feedback detalhado sobre sustentabilidade" },
            feedbackBriefingMatch: { type: Type.STRING, description: "Feedback detalhado sobre correspondência com o briefing" },
            
            generalVeredict: { type: Type.STRING, description: "Comentário geral do Professor Mediador, encorajador e construtivo" },
            practicalRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de sugestões práticas e diretas de melhoria (ex: 'Substitua a cadeira X por uma ergonômica', 'Afaste a mesa da porta')"
            }
          },
          required: [
            "scoreCirculation", "scoreErgonomics", "scoreAcousticLighting", "scoreAccessibility",
            "scoreBudget", "scoreSustainability", "scoreBriefingMatch",
            "feedbackCirculation", "feedbackErgonomics", "feedbackAcousticLighting", "feedbackAccessibility",
            "feedbackBudget", "feedbackSustainability", "feedbackBriefingMatch",
            "generalVeredict", "practicalRecommendations"
          ]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in pedagogical analysis:", error);
    res.status(500).json({ error: error.message });
  }
});

// REST API endpoint: AI Mentor Socratic discussion
app.post("/api/mentor/discuss", async (req, res) => {
  try {
    const { message, history, course, challenge, placedObjects } = req.body;
    const ai = getGeminiClient();

    const objectsSummary = (placedObjects || []).map((obj: any) => 
      `- ${obj.name} (${obj.category}) em X:${obj.x}m, Y:${obj.y}m (L:${obj.width}m x P:${obj.depth}m, Preço: R$ ${obj.price})`
    ).join("\n");

    const systemInstruction = `Você é o Mentor de Projeto IA do Laboratório Prático 360°, um professor mediador acadêmico experiente em ${course}.
Sua missão é conduzir o aluno ao aprendizado ativo pelo método socrático.
DIRETRIZES DO MENTOR:
1. NUNCA dê a resposta ou o layout ideal de bandeja.
2. Sempre faça perguntas provocativas que estimulem o raciocínio crítico sobre as decisões de design do aluno (ex: "Percebi que você colocou o sofá de costas para a porta. Qual foi a sua linha de raciocínio?", "Como esse posicionamento da mesa interfere no fluxo de uma pessoa em cadeira de rodas?").
3. Use o estado atual do projeto do aluno para personalizar suas perguntas. Aqui estão os objetos que o aluno já posicionou no espaço:
${objectsSummary || "Nenhum objeto posicionado ainda."}
4. O briefing do cliente ativo é: "${challenge.title}" - "${challenge.description}".
5. Mantenha um tom profissional, amigável, acadêmico e construtivo. Fale em português.`;

    const formattedContents = [
      ...history.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      })),
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ response: response.text || "O mentor está refletindo..." });
  } catch (error: any) {
    console.error("Error in mentor discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

// REST API endpoint: AI Generative layout positioning
app.post("/api/layout/generate", async (req, res) => {
  try {
    const { course, challenge, prompt, roomDimensions } = req.body;
    const ai = getGeminiClient();

    const systemPrompt = `Você é o Projetista Auxiliar IA do Laboratório Prático 360°.
Sua tarefa é gerar uma lista de mobiliários com suas posições ideais no cômodo de Largura ${roomDimensions.width}m x Comprimento ${roomDimensions.depth}m.
O tema/estilo solicitado pelo aluno é: "${prompt}".
O curso do aluno é: ${course}. O desafio pedagógico é: "${challenge.title}".

REGRAS DE POSICIONAMENTO CRÍTICAS (BIM/CAD):
1. Todos os objetos devem caber dentro do espaço (${roomDimensions.width}m por ${roomDimensions.depth}m).
2. Deixe rotas de circulação desimpedidas de pelo menos 0.80m a 1.20m (especialmente perto das bordas).
3. Especifique posições X e Y (coordenadas do canto superior esquerdo do objeto em metros) de forma que os móveis não fiquem sobrepostos.
4. Mantenha o preço total acumulado dentro do teto orçamentário do desafio: R$ ${challenge.budgetMax}.
5. Retorne os objetos em formato JSON estruturado respeitando a largura (width), profundidade (depth) e altura (height) de cada item. Os campos catalogId devem referenciar itens comuns (ex: 'obj-res-sofa', 'obj-res-mesatrabalho', 'obj-fono-audiometro', 'obj-physio-maca', etc. ou criar novos IDs consistentes).
6. Garanta que o JSON contenha uma lista de objetos em 'placedObjects' e uma curta 'justification' pedagógica para as escolhas de layout.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere um layout em formato JSON que atenda à solicitação "${prompt}". Dimensões do espaço: ${roomDimensions.width}m x ${roomDimensions.depth}m.`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            justification: { type: Type.STRING, description: "Breve justificativa técnica e pedagógica para o layout gerado" },
            placedObjects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  catalogId: { type: Type.STRING, description: "ID de catálogo sugerido" },
                  name: { type: Type.STRING, description: "Nome descritivo em português" },
                  category: { type: Type.STRING, description: "Categoria principal (Residencial, Clínicas, Equipamentos)" },
                  subcategory: { type: Type.STRING, description: "Subcategoria descritiva" },
                  x: { type: Type.NUMBER, description: "Posição X em metros do canto superior esquerdo" },
                  y: { type: Type.NUMBER, description: "Posição Y em metros do canto superior esquerdo" },
                  width: { type: Type.NUMBER, description: "Largura em metros" },
                  depth: { type: Type.NUMBER, description: "Profundidade em metros" },
                  height: { type: Type.NUMBER, description: "Altura em metros" },
                  rotation: { type: Type.INTEGER, description: "Rotação (0, 90, 180 ou 270 graus)" },
                  price: { type: Type.NUMBER, description: "Preço estimado em Reais (R$)" },
                  manufacturer: { type: Type.STRING, description: "Fabricante sugerido" },
                  material: { type: Type.STRING, description: "Material sugerido" }
                },
                required: ["catalogId", "name", "category", "subcategory", "x", "y", "width", "depth", "height", "rotation", "price", "manufacturer", "material"]
              }
            }
          },
          required: ["placedObjects", "justification"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in layout generation:", error);
    res.status(500).json({ error: error.message });
  }
});

// Configure Vite middleware in development or serve static build files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
