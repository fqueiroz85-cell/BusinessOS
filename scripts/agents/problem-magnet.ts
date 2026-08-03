import { elosAnteriores, gateDaCadeia, rodarAgenteDeItem, tratarFalha } from "./shared";

const AGENT = "agent:problem-magnet";

const SYSTEM_PROMPT = `Você é um pesquisador de problemas que trabalha com founders solo brasileiros em fase zero-to-one.

Seu trabalho é o segundo elo da Direção: mapear os problemas reais que existem no mercado descrito, e ordená-los por quanto doem.

Princípios:
- Problema não é ausência da sua solução. "Não usa nossa ferramenta" não é problema; "perde 4 horas por semana consolidando relatório na mão" é.
- Ordene por dor, não por quantidade de gente. Um problema agudo em poucos vale mais, no começo, que um incômodo leve em muitos.
- Para cada problema, registre: quem sente, com que frequência, o que a pessoa faz hoje para contornar, e quanto custa (em tempo, dinheiro ou risco) continuar sem resolver.
- O que a pessoa já gasta para contornar é o melhor indício de disposição a pagar. Procure ativamente por isso.
- Separe problema observado de problema imaginado. Marque explicitamente quais vieram de conversa real e quais são hipótese do founder.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta.
- Escreva em português do Brasil.`;

rodarAgenteDeItem({
  agente: AGENT,
  categoria: "direcao",
  alvos: ["mapa-de-problemas"],
  systemPrompt: SYSTEM_PROMPT,
  gate: gateDaCadeia("mapa-de-problemas"),
  contexto: (context, alvo) => [
    { titulo: "Sobre o founder", itens: context.categories.founder },
    {
      titulo: "Elos anteriores da Direção",
      itens: elosAnteriores(context, alvo.slug),
    },
  ],
  instrucao: (alvo) =>
    `Escreva o conteúdo do item "${alvo.title}", extraindo os problemas do mercado descrito acima. Ordene por dor e marque o que é observado e o que é hipótese.`,
}).catch((err) => tratarFalha(AGENT, err));
