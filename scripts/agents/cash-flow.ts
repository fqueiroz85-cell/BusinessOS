import { rodarAgenteDeItem, tratarFalha } from "./shared";

const AGENT = "agent:cash-flow";

const SYSTEM_PROMPT = `Você é um analista financeiro que trabalha com founders solo brasileiros em fase inicial, sem sócios e sem equipe.

Seu trabalho é estruturar o raciocínio de caixa do negócio: entradas, saídas, runway e — principalmente — as premissas por trás desses números.

Princípios:
- Premissa explícita vale mais que número preciso. Um founder em fase zero-to-one não tem dados históricos; ele tem hipóteses. Escreva as hipóteses de forma que possam ser conferidas depois.
- Runway é a pergunta central: quantos meses de operação o caixa atual sustenta, e o que muda esse número.
- Conecte o caixa do negócio à vida do founder. Se o estilo de vida desejado exige uma renda X e o negócio não caminha para X, isso é o achado mais importante do documento — diga com clareza.
- Este é um registro textual em Markdown, não uma planilha. Não invente tabelas de projeção com números fabricados.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta. Nunca invente valores em reais.
- Escreva em português do Brasil.`;

rodarAgenteDeItem({
  agente: AGENT,
  categoria: "caixa",
  // Fluxo de caixa antes de ERP: a ferramenta serve ao raciocínio, não o contrário.
  alvos: ["fluxo-de-caixa", "erp"],
  systemPrompt: SYSTEM_PROMPT,
  contexto: (context, alvo) => [
    // Founder entra porque o achado mais importante de um caixa de founder solo
    // costuma ser a distância entre o que o negócio paga e o que a vida custa.
    {
      titulo: "O que este negócio precisa sustentar (seção Founder)",
      itens: context.categories.founder,
    },
    {
      titulo: "A oferta que gera as entradas (seção Direção)",
      itens: context.categories.direcao.filter((i) => i.slug === "oferta"),
    },
    // O outro item do Caixa. Sem isto, o agente escreve `erp` sem enxergar o
    // capital declarado em `fluxo-de-caixa` — e conclui que não sabe com quanto
    // dinheiro o negócio conta, mesmo o founder já tendo respondido.
    {
      titulo: "Estado atual do Caixa (outros itens desta seção)",
      itens: context.categories.caixa.filter((i) => i.slug !== alvo.slug),
    },
  ],
  instrucao: (alvo) =>
    `Escreva o conteúdo do item "${alvo.title}" da seção Caixa. Cheque explicitamente se o plano de caixa sustenta o objetivo e o estilo de vida descritos acima — se não houver informação suficiente para isso, diga o que precisa ser preenchido.`,
}).catch((err) => tratarFalha(AGENT, err));
