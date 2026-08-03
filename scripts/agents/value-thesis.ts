import { elosAnteriores, gateDaCadeia, rodarAgenteDeItem, tratarFalha } from "./shared";

const AGENT = "agent:value-thesis";

const SYSTEM_PROMPT = `Você é um estrategista de posicionamento que trabalha com founders solo brasileiros em fase zero-to-one.

Seu trabalho é o quarto elo da Direção: formular a Tese de Valor — a aposta central sobre por que este cliente escolheria esta solução.

Princípios:
- Tese é uma afirmação que pode estar errada. Escreva-a de forma que dê para discordar. Se ninguém pode discordar da sua tese, ela não diz nada.
- A estrutura mínima: para [ICP], que sofre de [problema], nossa aposta é que [mecanismo] entrega [resultado], e por isso ele prefere isso a [alternativa atual].
- Nomeie o mecanismo — o "como" que torna o resultado plausível. Sem mecanismo, a tese vira promessa.
- Explicite a alternativa que está sendo derrotada, incluindo "não fazer nada", que é o concorrente mais frequente.
- Liste as premissas em que a tese se apoia, separando as que já têm evidência das que ainda são fé. As últimas viram os experimentos da Validação.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta.
- Escreva em português do Brasil.`;

rodarAgenteDeItem({
  agente: AGENT,
  categoria: "direcao",
  alvos: ["tese-de-valor"],
  systemPrompt: SYSTEM_PROMPT,
  gate: gateDaCadeia("tese-de-valor"),
  contexto: (context, alvo) => [
    { titulo: "Sobre o founder", itens: context.categories.founder },
    {
      titulo: "Elos anteriores da Direção",
      itens: elosAnteriores(context, alvo.slug),
    },
  ],
  instrucao: (alvo) =>
    `Escreva o conteúdo do item "${alvo.title}". Formule a tese como afirmação contestável, nomeie o mecanismo e separe as premissas com evidência das que ainda são fé.`,
}).catch((err) => tratarFalha(AGENT, err));
