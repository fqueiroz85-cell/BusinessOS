export type Question = {
  id: string;
  label: string;
  /** Texto de apoio sob o campo: explica o que uma boa resposta contém. */
  hint?: string;
  /** Exemplo dentro do campo vazio, quando ajuda mais que o `hint` sozinho. */
  placeholder?: string;
};

const QUESTIONS: Record<string, Record<string, Question[]>> = {
  founder: {
    objetivo: [
      {
        id: "porque-agora",
        label:
          "Por que você está construindo esse negócio, especificamente agora?",
      },
      {
        id: "marco-3-anos",
        label:
          "Em 3 anos, o que precisa ter acontecido para você dizer que valeu a pena?",
      },
      {
        id: "ocupacao",
        label:
          "Esse negócio é para virar sua ocupação principal, uma fonte de renda extra, ou algo que você pretende vender no futuro?",
      },
      {
        id: "ambicao",
        label:
          "Qual é o tamanho de ambição: um negócio enxuto e lucrativo (lifestyle business), ou uma empresa que escala e capta investimento?",
      },
      {
        id: "aprendizado",
        label:
          "Se o negócio não desse certo daqui a um ano, o que você gostaria de ter aprendido mesmo assim?",
      },
    ],
    "estilo-de-vida": [
      {
        id: "renda-minima",
        label:
          'Qual a renda mensal líquida que você precisa para viver com tranquilidade? E qual seria a renda "ideal"?',
      },
      {
        id: "horas-semana",
        label:
          "Quantas horas por semana você está disposto a dedicar ao negócio, hoje e daqui a um ano?",
      },
      {
        id: "flexibilidade",
        label:
          "Você precisa de flexibilidade de horário/localização (ex: trabalhar de qualquer lugar, cuidar dos filhos)? Quais são inegociáveis?",
      },
      {
        id: "evitar",
        label:
          "Que tipo de trabalho você quer evitar a todo custo (ex: vendas por telefone, gestão de equipe grande, viagens constantes)?",
      },
      {
        id: "semana-ideal",
        label:
          "Como é a sua semana ideal de trabalho, em termos de dias, horários e ritmo?",
      },
    ],
  },
  direcao: {
    "mapa-do-mercado": [
      {
        id: "territorio-mercado",
        label:
          "Qual é o tamanho estimado desse mercado (TAM/SAM/SOM), mesmo que seja uma estimativa grosseira?",
      },
      {
        id: "concorrentes-diretos",
        label:
          "Quem são os 3 a 5 principais concorrentes diretos? O que cada um faz bem e mal?",
      },
      {
        id: "concorrentes-indiretos",
        label:
          'Existem concorrentes indiretos (alternativas "caseiras", planilhas, não fazer nada) que competem pela atenção do cliente?',
      },
      {
        id: "dinamica-mercado",
        label:
          "O mercado está crescendo, estável ou encolhendo? O que está mudando nele agora (tecnologia, regulação, comportamento)?",
      },
      {
        id: "ponto-de-entrada",
        label:
          "Onde você pretende entrar: um nicho desatendido, um segmento de preço específico, uma geografia?",
      },
    ],
    "mapa-de-problemas": [
      {
        id: "principais-problemas",
        label:
          "Liste os 3 principais problemas (dores) que seu público-alvo enfrenta hoje, em ordem de intensidade.",
      },
      {
        id: "solucao-atual",
        label:
          "Para cada problema: como a pessoa resolve isso hoje, sem você? Quão bem essa solução funciona?",
      },
      {
        id: "urgente-vs-latente",
        label:
          "Qual desses problemas é urgente (a pessoa procura solução ativamente) versus latente (ela nem percebe que tem)?",
      },
      {
        id: "custo-do-problema",
        label:
          "Quanto esse problema custa para o cliente hoje — em dinheiro, tempo ou estresse?",
      },
      {
        id: "evidencia-real",
        label:
          "Existe evidência real (conversas, pesquisas, reclamações públicas) de que esse problema é sentido, ou é só uma suposição sua?",
      },
    ],
    "perfil-ideal-de-cliente": [
      {
        id: "perfil-demografico",
        label:
          "Descreva o perfil demográfico/firmográfico: idade, cargo, tamanho de empresa, setor, localização — o que for relevante.",
      },
      {
        id: "comportamento",
        label:
          "Quais características comportamentais definem esse cliente (ex: já tenta resolver o problema sozinho, tem orçamento próprio, decide rápido)?",
      },
      {
        id: "sinais-de-alerta",
        label:
          'O que faz um cliente ser "ruim" para o seu negócio, mesmo que pague? Liste sinais de alerta para evitar.',
      },
      {
        id: "onde-esta",
        label:
          "Onde esse cliente ideal passa tempo (comunidades, redes sociais, eventos, ferramentas que usa)?",
      },
      {
        id: "clientes-perfeitos",
        label:
          'Se você pudesse escolher 3 clientes atuais ou passados como "perfeitos", quem seriam e por quê?',
      },
    ],
    "tese-de-valor": [
      {
        id: "hipotese-central",
        label:
          'Complete a frase: "Eu acredito que [cliente] vai pagar por [solução] porque [motivo], e eu sou a pessoa certa para entregar isso porque [vantagem]."',
      },
      {
        id: "porque-agora",
        label:
          "Por que agora é o momento certo para esse negócio existir (mudança de mercado, tecnologia nova, janela de oportunidade)?",
      },
      {
        id: "vantagem-injusta",
        label:
          "Qual é a sua vantagem injusta: experiência, rede de contatos, conhecimento técnico, acesso a um nicho?",
      },
      {
        id: "crenca-contraria",
        label:
          "O que você acredita sobre esse mercado que a maioria das pessoas não acredita ou não percebe ainda?",
      },
      {
        id: "sinal-de-erro",
        label:
          "Se essa tese estiver errada, qual é o primeiro sinal que você veria?",
      },
    ],
    oferta: [
      {
        id: "escopo-oferta",
        label:
          "O que exatamente está incluso (produto, serviço, entregáveis, suporte)?",
      },
      {
        id: "formato",
        label:
          "Qual é o formato: projeto único, assinatura mensal, licença, consultoria por hora?",
      },
      {
        id: "preco",
        label:
          "Qual é o preço inicial e como você chegou nesse número (custo, valor percebido, benchmark de mercado)?",
      },
      {
        id: "promessa-central",
        label:
          "Qual é a promessa central da oferta em uma frase (o resultado que o cliente compra)?",
      },
      {
        id: "fora-de-escopo",
        label: "O que está deliberadamente fora do escopo nessa primeira versão?",
      },
    ],
  },
  validacao: {
    oferta: [
      {
        id: "pessoas-abordadas",
        label:
          "Quantas pessoas você já apresentou essa oferta, formalmente, com um preço na mesa?",
      },
      {
        id: "taxa-conversao",
        label:
          "Qual foi a taxa de conversão (quantos disseram sim versus quantos você abordou)?",
      },
      {
        id: "objecoes",
        label:
          "Quais objeções apareceram com mais frequência? Como você respondeu a cada uma?",
      },
      {
        id: "mudancas-na-oferta",
        label:
          "O que mudou na oferta desde a primeira versão, com base no que você ouviu dos clientes?",
      },
      {
        id: "pedidos-recorrentes",
        label:
          "Existe algo que os clientes pedem repetidamente que ainda não está incluso na oferta?",
      },
    ],
    "primeiros-clientes": [
      {
        id: "clientes-conquistados",
        label:
          "Liste os primeiros clientes conquistados: nome/empresa, o que compraram, quanto pagaram e quando.",
      },
      {
        id: "como-encontraram",
        label:
          "Como cada um te encontrou (indicação, conteúdo, prospecção ativa, rede pessoal)?",
      },
      {
        id: "padrao-comum",
        label:
          "O que esses primeiros clientes têm em comum? Isso confirma ou contradiz o Perfil Ideal de Cliente?",
      },
      {
        id: "clientes-perdidos",
        label:
          "Quais clientes você perdeu ou que disseram não — e qual foi o motivo real (preço, timing, confiança, fit)?",
      },
      {
        id: "case-ou-depoimento",
        label: "Qual desses clientes você usaria como case/depoimento hoje?",
      },
    ],
  },
  caixa: {
    "fluxo-de-caixa": [
      {
        id: "capital-inicial",
        label:
          "Quanto capital você tem disponível para colocar no negócio (verba de anúncio, ferramentas, estoque) — separado da sua reserva pessoal?",
      },
      {
        id: "entradas-mes",
        label:
          "Qual foi o total de entradas (receita recebida) no último mês fechado?",
      },
      {
        id: "saidas-mes",
        label:
          "Qual foi o total de saídas (custos fixos, variáveis, impostos, seu próprio pró-labore)?",
      },
      {
        id: "meses-de-reserva",
        label:
          'Quantos meses de "colchão" (reserva) você tem hoje, ao ritmo atual de queima de caixa?',
      },
      {
        id: "entradas-saidas-previstas",
        label:
          "Existe alguma entrada ou saída grande e previsível chegando nos próximos 90 dias?",
      },
      {
        id: "breakeven",
        label: "Qual é o seu ponto de equilíbrio (breakeven) mensal em receita?",
      },
    ],
    erp: [
      {
        id: "ferramentas-atuais",
        label:
          "Quais ferramentas você usa hoje para emitir notas fiscais, cobrar clientes e controlar contratos?",
      },
      {
        id: "registro-financeiro",
        label:
          "Como você registra receitas e despesas atualmente (planilha, app, contador, nada formalizado)?",
      },
      {
        id: "processo-doendo",
        label:
          "Existe algum processo manual e repetitivo que já está doendo e que precisaria de um sistema dedicado?",
      },
      {
        id: "contabilidade",
        label:
          "Você tem um contador ou serviço de contabilidade? Como é essa comunicação hoje?",
      },
      {
        id: "prioridade-automatizar",
        label:
          "Se fosse escolher UMA ferramenta para automatizar primeiro, qual traria mais alívio agora?",
      },
    ],
  },
};

/**
 * Texto de apoio de cada pergunta, exibido sob o campo no editor.
 *
 * Fica separado de `QUESTIONS` de propósito: o `label` é a pergunta em si —
 * conteúdo do produto — enquanto o `hint` é orientação de preenchimento, que
 * muda com mais frequência e por outro motivo. Chave externa é `categoria/slug`
 * porque ids se repetem entre itens (`porque-agora` existe em founder/objetivo
 * e em direcao/tese-de-valor).
 */
const HINTS: Record<string, Record<string, string>> = {
  "founder/objetivo": {
    "porque-agora": "O que mudou — no mercado, na tecnologia ou na sua vida.",
    "marco-3-anos": "Metas mensuráveis com prazo — não sensações.",
    ocupacao: "Diga também em quantos meses espera essa virada.",
    ambicao: "O tamanho da ambição — de projeto paralelo a mudar um setor inteiro.",
    aprendizado: "A competência que fica com você mesmo se o negócio não vingar.",
  },
  "founder/estilo-de-vida": {
    "renda-minima": "Dois números em reais: o piso de sobrevivência e o alvo.",
    "horas-semana": "Hoje e daqui a um ano — a curva importa mais que o número.",
    flexibilidade: "O que é inegociável na prática, não em princípio.",
    evitar: "Limites que descartam modelos de negócio inteiros.",
    "semana-ideal": "Dias, horários e ritmo — como a operação precisa caber.",
  },
  "direcao/mapa-do-mercado": {
    "territorio-mercado":
      "Ordem de grandeza basta. Diga de onde veio o número ou marque como hipótese.",
    "concorrentes-diretos": "Nomes reais, com o que cada um faz bem e mal.",
    "concorrentes-indiretos":
      "Inclua o substituto informal: planilha, YouTube, IA grátis, não fazer nada.",
    "dinamica-mercado": "O que mudou nos últimos 2 anos, e como você checa isso.",
    "ponto-de-entrada": "O recorte específico — não o mercado inteiro.",
  },
  "direcao/mapa-de-problemas": {
    "principais-problemas": "Em ordem de dor, não de quantidade de gente.",
    "solucao-atual": "O que ela já gasta contornando indica disposição a pagar.",
    "urgente-vs-latente": "Urgente é quem procura solução hoje. Latente ainda não sabe.",
    "custo-do-problema": "Em dinheiro, tempo ou risco — o mais concreto possível.",
    "evidencia-real": "Separe o que você observou do que você supôs.",
  },
  "direcao/perfil-ideal-de-cliente": {
    "perfil-demografico": "Só o que for critério de decisão, não ficha cadastral.",
    comportamento: "Prefira o observável ao psicológico — precisa dar para verificar.",
    "sinais-de-alerta": "O anti-ICP: quem paga mas você não deveria atender agora.",
    "onde-esta": "Onde ele já está hoje — é por ali que o anúncio chega.",
    "clientes-perfeitos": "Se não tem clientes ainda, descreva quem você busca primeiro.",
  },
  "direcao/tese-de-valor": {
    "hipotese-central": "Escreva de forma que dê para discordar.",
    "porque-agora": "A janela: por que isso não era possível ou óbvio antes.",
    "vantagem-injusta": "Se não houver nenhuma, diga isso — a tese muda de base.",
    "crenca-contraria": "O que você vê que o mercado ainda não precificou.",
    "sinal-de-erro": "O primeiro indício de que você errou, de preferência com número.",
  },
  "direcao/oferta": {
    "escopo-oferta": "O que o cliente recebe, item a item.",
    formato: "Compra única, assinatura, serviço — e por que cabe no seu tempo.",
    preco: "Ancore no valor do problema e no que ele já gasta hoje.",
    "promessa-central": "Uma frase: o resultado que o cliente compra.",
    "fora-de-escopo": "Dizer o que não está incluso protege a entrega.",
  },
  "validacao/oferta": {
    "pessoas-abordadas": "Quantas de verdade, e como você chegou nelas.",
    "taxa-conversao": "Números, mesmo que pequenos e feios.",
    objecoes: "A frase literal da pessoa vale mais que o resumo dela.",
    "mudancas-na-oferta": "O que o mercado te obrigou a mudar.",
    "pedidos-recorrentes": "O que pedem que você não vende — costuma ser o próximo produto.",
  },
  "validacao/primeiros-clientes": {
    "clientes-conquistados": "Quem pagou, quanto e quando.",
    "como-encontraram": "O canal que funcionou de fato, não o que você esperava.",
    "padrao-comum": "Isso confirma ou contradiz o seu ICP?",
    "clientes-perdidos": "O motivo real: preço, timing, confiança ou encaixe.",
    "case-ou-depoimento": "Quem você mostraria para vender ao próximo.",
  },
  "caixa/fluxo-de-caixa": {
    "capital-inicial": "Separado da sua reserva pessoal. Inclua limite de crédito, se usar.",
    "entradas-mes": "Último mês fechado, recebido de fato.",
    "saidas-mes": "Inclua taxas, impostos e o seu próprio pró-labore.",
    "meses-de-reserva": "Ao ritmo atual de queima, não no melhor cenário.",
    "entradas-saidas-previstas": "Próximos 90 dias: o que já está contratado.",
    breakeven: "Quanto de receita cobre todos os custos do mês.",
  },
  "caixa/erp": {
    "ferramentas-atuais": "Nota fiscal, cobrança, contratos — o que você usa hoje.",
    "registro-financeiro": '"Nada formalizado" é uma resposta válida.',
    "processo-doendo": "O que consome mais tempo ou gera mais erro.",
    contabilidade: "Quem cuida, quanto custa e o que ainda sobra para você.",
    "prioridade-automatizar": "Uma só — a que traria mais alívio agora.",
  },
};

export function getQuestions(category: string, slug: string): Question[] {
  const perguntas = QUESTIONS[category]?.[slug] ?? [];
  const hints = HINTS[`${category}/${slug}`];

  if (!hints) return perguntas;

  return perguntas.map((pergunta) =>
    pergunta.hint || !hints[pergunta.id]
      ? pergunta
      : { ...pergunta, hint: hints[pergunta.id] }
  );
}
