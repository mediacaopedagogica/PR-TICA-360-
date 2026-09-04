import { CourseType, Challenge, CatalogObject, Material, StudentProgress } from "./types";

export const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: "ch-interiors-1",
    course: CourseType.INTERIORS,
    title: "Apartamento Compacto: Living Integrado",
    description: "Criar uma sala de estar compacta que integre um home office funcional, assento confortável para 4 pessoas e elementos de biofilia. O orçamento é extremamente restrito e a circulação precisa seguir critérios rígidos de fluidez.",
    clientName: "Mariana Silva",
    clientRole: "Designer Gráfica & Home-officer",
    clientPersonality: "Prática, amante de plantas e minimalista. Prefere materiais naturais e cores quentes neutras.",
    clientAvatar: "👩‍💻",
    budgetMax: 15000,
    minArea: 12,
    requiredObjects: ["Sofá de 3 Lugares", "Mesa de Trabalho", "Cadeira de Escritório Ergonômica"],
    rubric: {
      circulation: "Rotas de fluxo principal livres com largura mínima de 80cm.",
      ergonomics: "Mesa de trabalho em altura correta (75cm) com cadeira ajustável e boa iluminação natural.",
      sustainability: "Uso de madeiras certificadas FSC, tecidos naturais e lâmpadas de baixo consumo.",
      accessibility: "Vãos de passagem acessíveis e sem obstáculos pontiagudos nas rotas."
    },
    unlocked: true
  },
  {
    id: "ch-fono-1",
    course: CourseType.SPEECH_THERAPY,
    title: "Consultório Infantil & Triagem Audiológica",
    description: "Projetar um consultório de fonoaudiologia focado em reabilitação infantil e exames de audição rápidos. O espaço exige isolamento acústico excelente, mobiliário infantil ergonômico, circulação fluida e equipamentos de alta precisão.",
    clientName: "Dr. Arthur Mendes",
    clientRole: "Fonoaudiólogo Clínico",
    clientPersonality: "Atencioso, focado em ciência e tecnologia. Preocupado com o conforto acústico para crianças hipersensíveis.",
    clientAvatar: "🩺",
    budgetMax: 28000,
    minArea: 15,
    requiredObjects: ["Audiômetro de Diagnóstico", "Cabine Acústica Portátil", "Mesa de Atendimento Infantil"],
    rubric: {
      circulation: "Distanciamento de segurança entre a cabine acústica e a mesa de terapia para evitar reverberação estrutural.",
      ergonomics: "Mesa e cadeiras com dimensões infantis adequadas e cantos arredondados.",
      sustainability: "Revestimentos acústicos recicláveis (cortiça ou lã de PET) e iluminação livre de cintilação (flicker-free).",
      accessibility: "Giro de cadeira de rodas de 1,50m preservado e rampa/porta de acesso adequada."
    },
    unlocked: true
  },
  {
    id: "ch-psych-1",
    course: CourseType.PSYCHOLOGY,
    title: "Consultório de Psicoterapia Humanista",
    description: "Desenvolver um consultório acolhedor para atendimento clínico individual e de casais. O sigilo acústico é prioritário, assim como a atmosfera calorosa que facilite a abertura emocional. Evitar layouts corporativos ou frios.",
    clientName: "Drª. Helena Vasconcelos",
    clientRole: "Psicóloga Fenomenológica",
    clientPersonality: "Empática, espiritualizada, prefere iluminação quente/indireta, tecidos texturizados e presença marcante de madeira.",
    clientAvatar: "🧠",
    budgetMax: 18000,
    minArea: 14,
    requiredObjects: ["Divã de Veludo", "Poltrona de Psicoterapia", "Luminária de Luz Indireta"],
    rubric: {
      circulation: "Distância recomendada de 1.8m a 2.4m entre as poltronas para equilíbrio entre intimidade e espaço pessoal.",
      ergonomics: "Mobiliário extremamente confortável com suporte lombar para sessões prolongadas.",
      sustainability: "Tintas com baixo VOC (compostos orgânicos voláteis) e fibras naturais renováveis.",
      accessibility: "Acesso livre a todas as áreas de assento com rota de circulação de 90cm livre."
    },
    unlocked: true
  },
  {
    id: "ch-physio-1",
    course: CourseType.PHYSIOTHERAPY,
    title: "Sala de Cinesioterapia & Reabilitação",
    description: "Desenhar um espaço amplo para fisioterapia cinesioterapêutica e reabilitação motora. O aluno deve prover rotas de circulação generosas para cadeirantes, barras de apoio sólidas, equipamentos de exercícios e superfícies antiderrapantes.",
    clientName: "Prof. Marcos Souza",
    clientRole: "Coordenador de Clínica Escola",
    clientPersonality: "Metódico, exigente com normas técnicas de segurança e integridade física dos pacientes.",
    clientAvatar: "🦴",
    budgetMax: 22000,
    minArea: 20,
    requiredObjects: ["Maca de Reabilitação Estofada", "Barras Paralelas de Treino", "Espaldar de Madeira"],
    rubric: {
      circulation: "Rotas de passagem desimpedidas com largura mínima de 1.20m para cadeiras de rodas e andadores.",
      ergonomics: "Alturas reguláveis para equipamentos e barras paralelas firmemente fixadas nas distâncias regulamentares.",
      sustainability: "Piso vinílico de alta durabilidade feito com plastificantes vegetais e madeira de reflorestamento no espaldar.",
      accessibility: "Conformidade total com a NBR 9050, incluindo barras de apoio de segurança e piso tátil direcional."
    },
    unlocked: true
  }
];

export const CATALOG_OBJECTS: CatalogObject[] = [
  // 🏠 RESIDENCIAL / DESIGN DE INTERIORES
  {
    id: "obj-res-sofa",
    name: "Sofá de 3 Lugares",
    category: "Residencial",
    subcategory: "Sala",
    width: 2.1,
    depth: 0.9,
    height: 0.85,
    price: 3200,
    weight: 45,
    material: "Tecido Linho & Madeira Pinus",
    manufacturer: "Mobiliária Elegance",
    sustainability: "Madeira com certificação FSC. Estofado com espuma livre de CFC.",
    accessibility: "Altura do assento de 45cm (confortável para levantar).",
    norms: "NBR 13579 (Colchões e colchonetes de espuma).",
    svgIcon: "sofa"
  },
  {
    id: "obj-res-armario",
    name: "Armário de Canto",
    category: "Residencial",
    subcategory: "Sala",
    width: 1.0,
    depth: 0.6,
    height: 1.8,
    price: 1850,
    weight: 70,
    material: "MDF Amadeirado",
    manufacturer: "MadeiraPrime",
    sustainability: "MDF E1 com baixa emissão de formaldeído.",
    accessibility: "Puxadores tipo alça acessíveis a pessoas de baixa estatura.",
    norms: "NBR 14555 (Móveis de madeira de guarda-roupa).",
    svgIcon: "wardrobe"
  },
  {
    id: "obj-res-mesatrabalho",
    name: "Mesa de Trabalho",
    category: "Residencial",
    subcategory: "Escritório",
    width: 1.2,
    depth: 0.6,
    height: 0.75,
    price: 1200,
    weight: 25,
    material: "MDF & Estrutura de Aço",
    manufacturer: "MetalDesign",
    sustainability: "Aço 100% reciclável e revestimento em pintura eletrostática a pó livre de solventes.",
    accessibility: "Vão livre inferior de 73cm de altura para encaixe de cadeira de rodas.",
    norms: "NBR 13966 (Móveis para escritório - Mesas).",
    svgIcon: "desk"
  },
  {
    id: "obj-res-cadeiraergonomica",
    name: "Cadeira de Escritório Ergonômica",
    category: "Residencial",
    subcategory: "Escritório",
    width: 0.65,
    depth: 0.65,
    height: 1.1,
    price: 890,
    weight: 15,
    material: "Poliuretano & Nylon",
    manufacturer: "ErgoChair Brasil",
    sustainability: "Componentes plásticos marcados para reciclagem.",
    accessibility: "Ajuste milimétrico de altura e apoio lombar flexível.",
    norms: "NR 17 (Ergonomia do Ministério do Trabalho) e NBR 13962.",
    svgIcon: "chair"
  },
  {
    id: "obj-res-mesacentro",
    name: "Mesa de Centro Orgânica",
    category: "Residencial",
    subcategory: "Sala",
    width: 0.8,
    depth: 0.5,
    height: 0.35,
    price: 650,
    weight: 8,
    material: "Madeira Maciça Taeda",
    manufacturer: "EcoArtesanal",
    sustainability: "Madeira de reflorestamento e acabamento em cera natural de abelha.",
    accessibility: "Altura baixa (pode constituir obstáculo visual/físico se colocada em rotas de passagem).",
    norms: "Sem normas impeditivas.",
    svgIcon: "coffeetable"
  },
  {
    id: "obj-res-vasoplantas",
    name: "Vaso de Plantas (Biofilia)",
    category: "Residencial",
    subcategory: "Varanda",
    width: 0.45,
    depth: 0.45,
    height: 1.2,
    price: 420,
    weight: 12,
    material: "Argila Queimada & Solo Orgânico",
    manufacturer: "Florestal Verde",
    sustainability: "Planta viva que melhora a qualidade do ar interno. Vaso artesanal.",
    accessibility: "Ajuda como balizador visual no ambiente.",
    norms: "N/A",
    svgIcon: "plant"
  },

  // 🏥 CLÍNICAS & CONSULTÓRIOS
  {
    id: "obj-cli-poltronapsi",
    name: "Poltrona de Psicoterapia",
    category: "Clínicas",
    subcategory: "Psicologia",
    width: 0.85,
    depth: 0.85,
    height: 0.95,
    price: 1680,
    weight: 22,
    material: "Tecido Suede & Espuma de Alta Densidade",
    manufacturer: "ClínicaComfort",
    sustainability: "Estrutura interna em compensado de reflorestamento.",
    accessibility: "Apoios de braço firmes que facilitam o sentar e levantar de idosos.",
    norms: "NBR 13962 (Móveis de assento clínicos e corporativos).",
    svgIcon: "armchair"
  },
  {
    id: "obj-cli-divan",
    name: "Divã de Veludo",
    category: "Clínicas",
    subcategory: "Psicologia",
    width: 1.85,
    depth: 0.75,
    height: 0.7,
    price: 2400,
    weight: 35,
    material: "Madeira Maciça & Veludo Sintético",
    manufacturer: "PsicoDesign",
    sustainability: "Revestimento durável e de fácil higienização, prolongando vida útil.",
    accessibility: "Requer rota lateral ampla para transferência de pacientes.",
    norms: "RDC 50 (Critérios de instalações físicas de saúde).",
    svgIcon: "divan"
  },
  {
    id: "obj-cli-mesainfantil",
    name: "Mesa de Atendimento Infantil",
    category: "Clínicas",
    subcategory: "Fonoaudiologia",
    width: 0.9,
    depth: 0.9,
    height: 0.55,
    price: 850,
    weight: 12,
    material: "Madeira de Pinus & Tampo Laminado colorido",
    manufacturer: "PedagogiaMóveis",
    sustainability: "Tinta atóxica à base de água e madeira de origem local.",
    accessibility: "Alturas projetadas ergonomicamente para crianças de 3 a 8 anos.",
    norms: "NBR 14006 (Móveis escolares - Limites ergonômicos).",
    svgIcon: "childtable"
  },
  {
    id: "obj-cli-macafisio",
    name: "Maca de Reabilitação Estofada",
    category: "Clínicas",
    subcategory: "Fisioterapia",
    width: 1.9,
    depth: 0.8,
    height: 0.65,
    price: 2100,
    weight: 40,
    material: "Estrutura de Aço Carbono & Corino Hospitalar",
    manufacturer: "FisioEquip",
    sustainability: "Estofamento lavável de altíssima durabilidade. Estrutura reciclável.",
    accessibility: "Altura padrão que permite transferência segura de cadeiras de rodas.",
    norms: "RDC 50 da ANVISA (Padrão de assepsia e medidas).",
    svgIcon: "stretcher"
  },

  // 🏥 EQUIPAMENTOS PROFISSIONAIS (Módulo 4)
  {
    id: "obj-eq-audiometro",
    name: "Audiômetro de Diagnóstico",
    category: "Equipamentos",
    subcategory: "Fonoaudiologia",
    width: 0.45,
    depth: 0.35,
    height: 0.2,
    price: 8500,
    weight: 5,
    material: "Plástico ABS Reciclável & Circuitos Eletrônicos",
    manufacturer: "Audium Tech",
    sustainability: "Dispositivo de baixo consumo elétrico e peças modulares para fácil manutenção.",
    accessibility: "Teclado de alto contraste e interface com feedback sonoro-visual.",
    norms: "IEC 60645-1 (Padrão internacional de equipamentos eletromédicos audiológicos).",
    svgIcon: "audiometer"
  },
  {
    id: "obj-eq-cabineacustica",
    name: "Cabine Acústica Portátil",
    category: "Equipamentos",
    subcategory: "Fonoaudiologia",
    width: 1.1,
    depth: 1.1,
    height: 2.0,
    price: 11500,
    weight: 180,
    material: "Chapas de Aço, Isolante Lã de Vidro & Vidros Duplos",
    manufacturer: "SilenceCorp",
    sustainability: "Painéis de isolamento biodegradáveis. Vidro temperado infinitamente reciclável.",
    accessibility: "Soleira baixa de 2cm e porta larga de 80cm de abertura para acesso facilitado.",
    norms: "NBR ISO 8253-1 (Exames audiológicos em cabines com níveis de ruído de fundo controlados).",
    svgIcon: "booth"
  },
  {
    id: "obj-eq-espaldar",
    name: "Espaldar de Madeira",
    category: "Equipamentos",
    subcategory: "Fisioterapia",
    width: 0.9,
    depth: 0.15,
    height: 2.3,
    price: 1100,
    weight: 18,
    material: "Madeira Maciça de Eucalipto Tratada",
    manufacturer: "FisioForma",
    sustainability: "Madeira de reflorestamento rastreável com selo de origem florestal.",
    accessibility: "Vários níveis de barras horizontais para reabilitação em diferentes estaturas.",
    norms: "NBR ISO 14001 (Padrão ambiental do fabricante).",
    svgIcon: "ladder"
  },
  {
    id: "obj-eq-barrasparalelas",
    name: "Barras Paralelas de Treino",
    category: "Equipamentos",
    subcategory: "Fisioterapia",
    width: 2.5,
    depth: 0.8,
    height: 0.95,
    price: 3400,
    weight: 55,
    material: "Aço Inox & Base em Madeira Compensada",
    manufacturer: "RehabTech",
    sustainability: "Aço inoxidável de longa durabilidade (garantia de 10 anos) e reciclável.",
    accessibility: "Largura ajustável e piso com rampa de acesso antiderrapante.",
    norms: "NBR 9050 e diretrizes do Ministério da Saúde para clínicas de reabilitação física.",
    svgIcon: "parallelbars"
  },

  // 🏢 COMERCIAL / ADICIONAIS
  {
    id: "obj-com-luminariadireta",
    name: "Luminária de Luz Indireta",
    category: "Comercial",
    subcategory: "Recepção",
    width: 0.4,
    depth: 0.4,
    height: 1.65,
    price: 490,
    weight: 6,
    material: "Alumínio Anodizado & Cúpula de Algodão",
    manufacturer: "LuzAmbiente",
    sustainability: "Equipada com lâmpada LED A+ inteligente de 9W (consumo 85% menor).",
    accessibility: "Interruptor de piso facilitado de fácil acesso físico.",
    norms: "NBR ISO/CIE 8995-1 (Iluminação de locais de trabalho).",
    svgIcon: "lamp"
  },
  {
    id: "obj-com-biombo",
    name: "Biombo de Privacidade Acústico",
    category: "Comercial",
    subcategory: "Studio",
    width: 1.2,
    depth: 0.05,
    height: 1.6,
    price: 750,
    weight: 10,
    material: "Estrutura de Alumínio & Painel Feltro Pet Reciclado",
    manufacturer: "AcousticDecor",
    sustainability: "Feltro fabricado a partir de garrafas PET 100% pós-consumo recicladas.",
    accessibility: "Fornece excelente balizamento acústico e zonificação sem barreiras físicas rígidas.",
    norms: "NBR 12179 (Tratamento acústico em recintos fechados).",
    svgIcon: "divider"
  }
];

export const PRESET_MATERIALS: Material[] = [
  // PISOS
  {
    id: "mat-porcelanato-carrara",
    name: "Porcelanato Bianco Carrara",
    category: "porcelanatos",
    material: "Cerâmica esmaltada de alta resistência",
    price: 180,
    color: "#f3f4f6", // light grey/white vein look
    manufacturer: "Portobello SA",
    sustainability: "Processo de queima energeticamente eficiente com reuso de 98% da água fabril."
  },
  {
    id: "mat-vinilico-carvalho",
    name: "Piso Vinílico Carvalho Natural",
    category: "pisos vinílicos",
    material: "PVC virgem com revestimento acústico",
    price: 110,
    color: "#d7b282", // oak wooden tone
    manufacturer: "Duratex Pisos",
    sustainability: "Livre de ftalatos, com certificação FloorScore de baixa emissão química interna."
  },
  {
    id: "mat-laminado-nogueira",
    name: "Laminado Nogueira Rustica",
    category: "laminados",
    material: "HDF de alta densidade revestido",
    price: 95,
    color: "#8b5a2b", // dark walnut tone
    manufacturer: "Eucatex",
    sustainability: "Fibras de madeira de reflorestamento 100% certificadas FSC."
  },
  {
    id: "mat-marmore-crema",
    name: "Mármore Crema Marfil",
    category: "mármores",
    material: "Rocha calcária natural polida",
    price: 380,
    color: "#f5ece1", // beige marble
    manufacturer: "Pedras do Mundo",
    sustainability: "Extração mineral local licenciada com plano de recuperação ambiental de lavra."
  },

  // PAREDES / TINTAS
  {
    id: "mat-tinta-algodao",
    name: "Tinta Algodão Egípcio (Toque de Seda)",
    category: "tintas",
    material: "Tinta acrílica premium solúvel em água",
    price: 25,
    color: "#eceae2", // warm off-white
    manufacturer: "Suvinil",
    sustainability: "Fórmula à base de água com baixíssimo odor e zero VOC nocivo à saúde."
  },
  {
    id: "mat-tinta-salvia",
    name: "Tinta Verde Sálvia Calmante",
    category: "tintas",
    material: "Tinta acrílica premium acabamento fosco",
    price: 25,
    color: "#99a799", // calming sage green
    manufacturer: "Coral Tintas",
    sustainability: "Certificação de Baixa Emissão e livre de metais pesados."
  },
  {
    id: "mat-tinta-terracota",
    name: "Tinta Terracota Natural",
    category: "tintas",
    material: "Tinta mineral à base de silicato",
    price: 32,
    color: "#b85c37", // warm terracota
    manufacturer: "EcoTintas",
    sustainability: "Totalmente orgânica, respirável (previne mofo) e sem conservantes químicos."
  },
  {
    id: "mat-papel-geometrico",
    name: "Papel de Parede Retrô Geométrico",
    category: "papéis de parede",
    material: "Papel vinílico lavável",
    price: 65,
    color: "#e5e7eb", // neutral geometrical pattern representation
    manufacturer: "WallArt",
    sustainability: "Papel de floresta plantada e tintas de soja não tóxicas."
  },

  // REVESTIMENTOS ESPECIAIS (MDF / MADEIRA)
  {
    id: "mat-painel-freijo",
    name: "Painel MDF Freijó ripado",
    category: "MDF",
    material: "MDF melamínico ripado",
    price: 140,
    color: "#c29b69", // Freijo wood tone
    manufacturer: "FibraPlac",
    sustainability: "MDF de reflorestamento, adesivos livres de formaldeído."
  },
  {
    id: "mat-madeira-demolicao",
    name: "Madeira de Demolição Tratada",
    category: "madeiras",
    material: "Peroba rosa recuperada e selada",
    price: 250,
    color: "#784b31", // dark rustic wood
    manufacturer: "EcoDemolição",
    sustainability: "Madeira 100% reciclada e reaproveitada de estruturas antigas de fazendas."
  }
];

export const MOCK_STUDENT_PROGRESS: StudentProgress[] = [
  {
    id: "st-1",
    studentName: "Ana Clara Medeiros",
    avatar: "👩‍🎓",
    course: CourseType.INTERIORS,
    challengeTitle: "Apartamento Compacto: Living Integrado",
    completedSteps: 4,
    lastScore: 9.2,
    budgetStatus: "ok",
    lastActive: "Hoje, 10:45"
  },
  {
    id: "st-2",
    studentName: "Lucas Gabriel Costa",
    avatar: "🧑‍🎓",
    course: CourseType.SPEECH_THERAPY,
    challengeTitle: "Consultório Infantil & Triagem Audiológica",
    completedSteps: 3,
    lastScore: 7.8,
    budgetStatus: "exceeded",
    lastActive: "Ontem, 16:30"
  },
  {
    id: "st-3",
    studentName: "Juliana Peixoto",
    avatar: "👩‍⚕️",
    course: CourseType.PSYCHOLOGY,
    challengeTitle: "Consultório de Psicoterapia Humanista",
    completedSteps: 4,
    lastScore: 8.5,
    budgetStatus: "ok",
    lastActive: "Há 2 horas"
  },
  {
    id: "st-4",
    studentName: "Thiago Ramos",
    avatar: "👨‍🎓",
    course: CourseType.PHYSIOTHERAPY,
    challengeTitle: "Sala de Cinesioterapia & Reabilitação",
    completedSteps: 2,
    lastScore: 6.5,
    budgetStatus: "ok",
    lastActive: "Há 3 dias"
  }
];
