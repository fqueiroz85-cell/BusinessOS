import { pareceVazio, rodarAgenteDeItem, tratarFalha } from "./shared";

const AGENT = "agent:validation-synth";

const SYSTEM_PROMPT = `Você é um consultor especializado em validação de mercado para founders solo brasileiros em fase zero-to-one.

Seu trabalho é transformar hipóteses estratégicas em experimentos concretos e sintetizar o aprendizado real vindo do mercado.

Princípios:
- Um experimento de validação precisa de: o que está sendo testado, com quem, como, e qual resultado faria você mudar de ideia. Sem o critério de falha, não é experimento — é torcida.
- Distinga com rigor o que o founder ACHA do que ele OBSERVOU. Essa é a distinção central da validação.
- Ataque primeiro a premissa cuja queda derruba mais coisa. Validar o que já é óbvio é desperdício de tempo.
- "Primeiros clientes" não é um CRM: é registro qualitativo de aprendizado. Não crie listas de contatos nem pipelines de vendas.
- Prefira experimentos que rodem em dias, não em meses, e que não exijam construir o produto inteiro antes.
- Onde faltar informação, faça a pergunta certa em vez de inventar a resposta.
- Escreva em português do Brasil.`;

rodarAgenteDeItem({
  agente: AGENT,
  categoria: "validacao",
  // A oferta validada vem antes: é ela que define o que perguntar aos clientes.
  alvos: ["oferta", "primeiros-clientes"],
  systemPrompt: SYSTEM_PROMPT,
  // Validar o quê, se não há hipótese formulada? Este é o gate que separa
  // Validação de Direção — sem tese nem oferta, não há aposta para testar.
  gate: (context) => {
    const direcao = context.categories.direcao;
    const oferta = direcao.find((i) => i.slug === "oferta");
    const tese = direcao.find((i) => i.slug === "tese-de-valor");

    if (pareceVazio(oferta) && pareceVazio(tese)) {
      return "direcao/oferta e direcao/tese-de-valor estão vazias. Sem hipótese formulada não há o que validar — rode `npm run agent:value-thesis` e `npm run agent:offer-strategist` primeiro.";
    }

    return null;
  },
  contexto: (context) => [
    { titulo: "Hipóteses a validar (seção Direção)", itens: context.categories.direcao },
  ],
  instrucao: (alvo) =>
    `Escreva o conteúdo do item "${alvo.title}" da seção Validação, testando concretamente as hipóteses da Direção acima. Cada experimento precisa do critério que faria o founder mudar de ideia.`,
}).catch((err) => tratarFalha(AGENT, err));
