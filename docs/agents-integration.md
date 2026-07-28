# Integração com Agentes de IA e Skills — Arquitetura

**Status:** proposta de arquitetura + fase 1 e fase 2 implementadas.
**Relacionado:** `docs/briefing.md` (visão de produto), `docs/prd.md` (fora de escopo v1), `docs/spec.md` (seção 11 — Integração Futura: Agentes de IA e Skills).

Este documento detalha, em nível de implementação, como agentes de IA externos ao BusinessOS vão ler e (no futuro) escrever no contexto de negócio armazenado em `content/`. Ele assume o modelo de dados já existente: cada item é um arquivo `.md` com frontmatter YAML, acessado via `lib/content.ts` (`getCategoryItems`, `getItem`, `saveItem`), agrupado em 4 categorias fixas (`founder`, `direcao`, `validacao`, `caixa`).

---

## 1. Modelo mental: agente vs. skill

Dois conceitos distintos, que não devem ser confundidos:

- **Agente** — um processo de IA com um objetivo e um ciclo de raciocínio próprio (ex.: "ajudar Felipe a preencher a Direção do negócio esta semana"). Um agente decide *o quê* fazer, em que ordem, e pode invocar uma ou mais skills para executar passos concretos. É a camada de orquestração/decisão.
- **Skill** — uma capacidade reutilizável, especializada e stateless, que um agente invoca para executar uma tarefa concreta sobre um item de conteúdo específico (ex.: "pesquisar mercado e propor um Mapa do Mercado", "redigir uma Tese de Valor a partir do ICP existente", "analisar o Fluxo de Caixa e sinalizar riscos de runway"). Uma skill não decide *se* deve agir — ela recebe uma instrução e um contexto, e devolve uma proposta. É a camada de execução.

Analogia prática: o agente é o "consultor" que olha o negócio como um todo e decide que a Tese de Valor precisa de atenção esta semana; a skill "redigir tese de valor" é a ferramenta específica que ele usa para produzir um rascunho, dado o contexto de `direcao/mapa-de-problemas.md` e `direcao/perfil-ideal-de-cliente.md`.

Essa separação importa porque:

1. **Skills são compostas e testáveis isoladamente** — uma skill de "pesquisar mercado" pode ser usada por múltiplos agentes diferentes, ou até chamada diretamente por Felipe sem um agente orquestrando nada.
2. **Permissões são naturalmente escopadas por skill**, não por agente inteiro — uma skill declara exatamente quais `category`/`slug` ela lê e escreve (ver seção 4), o que é mais seguro do que dar a um agente acesso irrestrito a todo `content/`.
3. **O contrato entre skill e sistema é pequeno e estável** (seção 4), enquanto a lógica de um agente (que skills chamar, em que ordem, com que prompt) pode evoluir livremente sem alterar a superfície de API do BusinessOS.

Nenhum agente ou skill roda dentro do processo do BusinessOS nesta fase — eles são processos externos (scripts, outros agentes de IA, notebooks) que consomem a API HTTP do app. O BusinessOS não hospeda nem executa modelos de IA; ele expõe leitura/escrita estruturada do contexto de negócio.

---

## 2. Como um agente LÊ o contexto: `GET /api/context`

Implementado nesta fase em `app/api/context/route.ts`.

Este é o ponto de entrada canônico de leitura. Em vez de um agente externo ler arquivos `.md` diretamente do disco (o que exigiria acesso ao filesystem do BusinessOS, replicar a lógica de parsing do `gray-matter`, e não funcionaria se o backend migrar para Supabase no futuro — ver seção 6), ele faz uma requisição HTTP simples:

```
GET /api/context
```

Resposta (`200 OK`, `application/json`):

```jsonc
{
  "generatedAt": "2026-07-11T18:03:00.000Z",
  "categories": {
    "founder": [
      {
        "title": "Objetivo",
        "slug": "objetivo",
        "category": "founder",
        "order": 1,
        "summary": "Onde eu quero chegar com este negócio nos próximos anos.",
        "status": "in_progress",
        "updatedAt": "2026-07-05",
        "body": "## Onde eu quero chegar\n\n..."
      }
      // ...demais itens de founder
    ],
    "direcao": [ /* ... */ ],
    "validacao": [ /* ... */ ],
    "caixa": [ /* ... */ ]
  }
}
```

Características de design:

- **Todo o conteúdo, sempre completo.** A rota devolve as 4 categorias e todos os itens de cada uma (frontmatter + `body` em Markdown), sem paginação nem filtros nesta fase. Um agente que precise de contexto de negócio parte deste snapshot completo — o volume de conteúdo de um founder solo é pequeno o suficiente para isso ser trivial (11 itens na v1).
- **Somente leitura.** A rota não aceita nenhum método além de `GET` e não tem efeito colateral algum sobre `content/`.
- **`generatedAt` é o timestamp da resposta**, não de um item específico — cada item já carrega seu próprio `updatedAt` no frontmatter. `generatedAt` serve para o agente saber "quão fresco" é o snapshot que está segurando, útil se ele cachear a resposta por alguns minutos antes de agir.
- **Reaproveita `lib/content.ts` diretamente** (`getCategoryItems`), a mesma camada de acesso a dados usada pelas páginas do app — não há uma segunda implementação de leitura de `.md` só para agentes. Isso garante que o que um agente vê é exatamente o que Felipe vê na UI, sem risco de divergência.
- **Filtros futuros** (`?category=direcao`, `?status=in_progress`) podem ser adicionados sem quebrar compatibilidade, já que hoje nenhum parâmetro é obrigatório.

---

## 3. Como um agente ESCREVE de volta

Fora de escopo da fase 1 (ver roadmap, seção 7) — descrito aqui como proposta de arquitetura para a fase 2.

Duas abordagens foram consideradas:

### Opção A — Reusar `POST /api/content` (já existe, usado pela UI)

A rota atual (`app/api/content/route.ts`) já aceita `{ category, slug, title?, summary?, status?, body? }` e chama `saveItem`. Um agente poderia, em teoria, chamar essa mesma rota.

- **Vantagem:** zero rota nova, reaproveita validação e serialização já existentes.
- **Desvantagem:** a escrita de um agente fica indistinguível da escrita de Felipe via UI — não há como saber, olhando o histórico do Git ou o `updatedAt`, se uma mudança veio de um humano ou de uma skill automatizada. Isso compromete rastreabilidade e dificulta implementar revisão humana obrigatória (seção 5) sem misturar os dois fluxos.

### Opção B — Rota dedicada `POST /api/agent/write` (recomendada)

Uma rota nova, com um payload que estende o da rota existente com metadados de proveniência:

```typescript
type AgentWritePayload = {
  category: string;
  slug: string;
  title?: string;
  summary?: string;
  status?: ContentStatus;
  body?: string;
  // Campos novos, exclusivos de escrita por agente:
  agent: string;       // identificador do agente/skill que originou a mudança
                        // ex.: "skill:mapa-do-mercado", "agent:coach-validacao"
  rationale?: string;  // por que a skill propôs esta mudança (auditoria/log)
};
```

Internamente, a rota reaproveita `saveItem` de `lib/content.ts` (mesma função usada por `POST /api/content`) — não há uma segunda implementação de persistência —, mas:

1. Registra a proveniência da escrita (quem/o que mudou o quê), viabilizando um log de auditoria simples.
2. É o ponto natural para aplicar o fluxo de revisão humana da seção 5, sem afetar o caminho de escrita humana existente.
3. Pode aplicar políticas diferentes da escrita humana (ex.: nunca sobrescrever `status: "done"` sem confirmação explícita, mesmo que a skill tente).

**Recomendação:** implementar a Opção B quando a fase 2 começar. A rota `POST /api/content` continua sendo o caminho de escrita humana via UI; `POST /api/agent/write` é o caminho de escrita por agente — dois caminhos de entrada, uma única função de persistência (`saveItem`) e uma única fonte de verdade (`content/*.md`).

---

## 4. Contrato de uma skill

Para que skills sejam plugáveis e substituíveis, o "contrato" de entrada/saída de um handler de skill deve ser estável e independente de qual agente a invoca ou qual modelo de IA a implementa.

### Entrada

```typescript
type SkillInput = {
  category: string;        // "founder" | "direcao" | "validacao" | "caixa"
  slug: string;             // item específico que a skill vai trabalhar
  currentContent: {
    title: string;
    summary: string;
    status: ContentStatus;
    body: string;           // corpo markdown atual, pode estar vazio
  };
  instruction: string;      // instrução em linguagem natural do agente/founder
                             // ex.: "Preencha o Mapa do Mercado com base em
                             // concorrentes de ferramentas de gestão para founders solo"
  relatedContext?: BusinessContext; // opcional: snapshot de /api/context inteiro,
                                     // para skills que precisam de itens de outras
                                     // categorias (ex. Tese de Valor lendo o ICP)
};
```

### Saída

```typescript
type SkillOutput = {
  proposedBody: string;      // novo corpo markdown proposto (substitui `body`)
  proposedSummary?: string;  // resumo atualizado, se a skill julgar necessário
  rationale: string;         // explicação legível por humano do que mudou e por quê
                              // (mostrado a Felipe na revisão, seção 5)
  confidence?: "low" | "medium" | "high"; // opcional, sinaliza o quão pronta
                              // a skill considera a proposta
};
```

Regras do contrato:

- Uma skill **nunca escreve diretamente em disco**. Ela recebe `currentContent` (lido via `/api/context` ou `getItem`) e devolve um `SkillOutput` — a persistência é sempre responsabilidade da rota de escrita (seção 3), nunca da skill.
- Uma skill é **stateless entre chamadas**: todo o contexto de que ela precisa vem em `SkillInput`. Isso permite trocar a implementação de uma skill (ex. trocar de modelo de IA) sem alterar o restante do sistema.
- `rationale` é obrigatório porque toda proposta de skill passa por revisão humana antes de virar conteúdo salvo (seção 5) — sem explicação, Felipe não tem base para aceitar ou rejeitar a proposta.

---

## 5. Segurança e revisão humana

Dar a agentes a capacidade de escrever no negócio de Felipe é, por definição, dar a eles a capacidade de errar de forma silenciosa — um risco maior do que erros de leitura. Por isso, a escrita por agente nunca deve ir direto para o arquivo `.md` final na fase 2; ela passa por um estado intermediário de revisão.

**Extensão futura do frontmatter proposta:**

```yaml
---
title: "Mapa do Mercado"
slug: "mapa-do-mercado"
category: "direcao"
order: 1
summary: "..."
status: "in_progress"
updatedAt: "2026-07-11"
# Campos novos, opcionais, presentes apenas quando há uma proposta pendente:
reviewStatus: "proposed"        # "proposed" | "accepted" | "rejected" (ausente = sem proposta pendente)
proposedBy: "skill:mapa-do-mercado"
proposedAt: "2026-07-11T18:00:00.000Z"
proposedRationale: "Adicionei 3 concorrentes diretos com base em pesquisa pública."
---
```

Fluxo proposto:

1. Uma skill gera um `SkillOutput`. A rota de escrita (`POST /api/agent/write`) **não sobrescreve `body`** — em vez disso, grava a proposta em campos separados (`proposedBody` seria persistido de forma análoga, ou em um arquivo/registro paralelo, a definir na fase 2) e marca `reviewStatus: "proposed"`.
2. A UI do BusinessOS passa a exibir, na página de detalhe do item, um indicador de "proposta pendente de [skill X]" com a `rationale`, permitindo a Felipe comparar o conteúdo atual com o proposto lado a lado.
3. Felipe **aceita** (o conteúdo proposto substitui `body`, `reviewStatus` volta a ficar ausente/`"accepted"`) ou **rejeita** (a proposta é descartada, `body` original permanece intacto) — sempre uma ação humana explícita.
4. Nenhuma skill pode, por si só, mover um item para `reviewStatus: "accepted"`. Esse é o limite de segurança central: **agentes propõem, o founder dispõe**.

Considerações adicionais:

- **Escopo de permissão por skill** (mencionado na seção 1): cada skill deve declarar explicitamente quais `category`/`slug` pode propor mudanças — não existe skill com acesso irrestrito a `content/`. Essa validação acontece no lado do BusinessOS (na rota de escrita), não confiando apenas na boa conduta do agente externo.
- **Nunca sobrescrever silenciosamente conteúdo com `status: "done"`** sem sinalizar isso de forma destacada na revisão — um item que Felipe já marcou como concluído merece mais fricção antes de ser alterado por um agente.
- **Auditoria mínima**: `proposedBy` + `proposedAt` + `proposedRationale` (ou um log separado, se o volume justificar) são suficientes na escala de um founder solo; não é necessário um sistema de auditoria complexo nesta fase.
- **Sem autenticação hoje** (consistente com o restante da v1 — ver `docs/prd.md`, seção "Fora de escopo"): como o BusinessOS roda localmente e sem login, `/api/context` e a futura `/api/agent/write` não têm controle de acesso. Isso é aceitável apenas enquanto o app roda localmente; se/quando for exposto publicamente (ex. após migração para Supabase, seção 6), essas rotas precisam de autenticação antes de aceitar escrita — leitura pública de `/api/context` também deveria ser reavaliada nesse momento, já que o conteúdo pode incluir informação estratégica sensível do negócio.

---

## 6. Relação com a migração futura para Supabase

Conforme `docs/spec.md` (seção 10), a camada `lib/content.ts` é o único ponto de acesso a dados hoje, e a intenção é que uma futura migração para Supabase troque sua implementação interna mantendo a mesma assinatura (`getItem`, `getCategoryItems`, `saveItem`). Isso significa que `GET /api/context` e a futura `POST /api/agent/write`, por dependerem exclusivamente dessa camada e não do filesystem diretamente, **não precisam mudar** quando essa migração acontecer — o contrato HTTP que agentes externos consomem permanece estável independentemente de o conteúdo estar em arquivos `.md` ou em uma tabela Postgres. Os campos de revisão humana propostos na seção 5 (`reviewStatus`, `proposedBy`, etc.) também mapeiam naturalmente para colunas adicionais na tabela `items` do schema esboçado em `docs/spec.md`.

---

## 7. Roadmap de fases

### Fase 1 — Leitura via `/api/context` (implementada nesta mudança)

- `GET /api/context` retorna todo o conteúdo estruturado das 4 categorias como JSON, reaproveitando `getCategoryItems` de `lib/content.ts`.
- Nenhuma escrita por agente. Nenhuma skill implementada. Nenhuma UI de revisão.
- Objetivo: validar que o contrato de leitura é suficiente para um agente externo (ex. um script simples, ou outro agente de IA) consumir o contexto de negócio de forma completa e correta.

### Fase 2 — Propostas de mudança via skills, com revisão humana (implementada nesta mudança)

- Implementar `POST /api/agent/write` (seção 3, Opção B) com os campos `agent`/`rationale`.
- Estender o frontmatter com `reviewStatus`/`proposedBy`/`proposedAt`/`proposedRationale` (seção 5).
- Adicionar à UI de detalhe do item um estado visual de "proposta pendente" com ações de aceitar/rejeitar.
- Implementar as primeiras 1–2 skills de referência (ex. "Mapa do Mercado" e "Tese de Valor", citadas em `docs/spec.md` seção 11.2) seguindo o contrato da seção 4, para validar o fluxo ponta a ponta antes de generalizar para mais skills.
- Nenhum agente ainda decide sozinho quando agir — a invocação de uma skill nesta fase é sempre iniciada manualmente por Felipe (ex. um comando/script que ele executa), não um processo autônomo rodando em background.

### Fase 3 — Agentes autônomos com permissões granulares

- Agentes passam a rodar de forma autônoma/agendada (não apenas sob comando manual de Felipe), monitorando `/api/context` periodicamente e decidindo por conta própria quando uma skill deveria propor uma atualização (ex. "faz 30 dias que `validacao/primeiros-clientes.md` não muda e há itens novos em `caixa/` — vale revisitar").
- Sistema de permissões granular por agente/skill: um registro explícito (ex. `agents.config.json` ou equivalente) declarando, por agente, quais `category`/`slug` ele pode ler e propor escrita, evitando que qualquer agente conectado tenha acesso irrestrito a todo o negócio.
- Possível introdução de autenticação/tokens de API por agente (quem está fazendo a chamada), especialmente relevante se o BusinessOS já tiver migrado para Supabase (seção 6) e estiver acessível fora do ambiente local.
- Revisão humana continua obrigatória para qualquer escrita que altere `body` de forma substancial; agentes autônomos podem, no máximo, ganhar permissão para mudanças de baixo risco sem revisão prévia (ex. atualizar apenas `summary`), a definir com base em uso real da fase 2.

---

## 8. Resumo das decisões desta mudança

- `GET /api/context` implementado em `app/api/context/route.ts`, reaproveitando `getCategoryItems` de `lib/content.ts` — sem duplicar lógica de leitura/parsing de `.md`.
- Nenhuma rota de escrita por agente foi criada nesta fase; `POST /api/content` continua sendo exclusivamente o caminho de escrita da UI humana.
- A arquitetura de skills, o contrato de entrada/saída, e o modelo de revisão humana ficam documentados aqui como proposta para a fase 2, não implementados agora.

---

## 9. Resumo das decisões — Fase 2

- `lib/content.ts` ganhou `proposeChange`, `acceptProposal` e `rejectProposal`, seguindo o fluxo da seção 5: uma skill nunca sobrescreve `body` diretamente — `proposeChange` grava a proposta em campos separados e marca `reviewStatus: "proposed"`; `acceptProposal` promove `proposedBody`/`proposedSummary` para `body`/`summary` e limpa os campos de proposta; `rejectProposal` descarta a proposta preservando o conteúdo original.
- Duas rotas novas em `app/api/agent/`: `POST /api/agent/write` (Opção B da seção 3 — recebe `{ category, slug, agent, rationale, body?, summary? }`, chama `proposeChange`, devolve `{ success: true, item }` ou `{ success: false, error }`) e `POST /api/agent/review` (aplica a decisão humana de aceitar/rejeitar uma proposta pendente, chamando `acceptProposal`/`rejectProposal`).
- `ContentItem` (em `lib/content.ts`) ganhou os campos opcionais de frontmatter descritos na seção 5: `reviewStatus`, `proposedBy`, `proposedAt`, `proposedRationale`, `proposedSummary`, `proposedBody` — presentes apenas quando há uma proposta pendente.
- A UI ganhou o componente `ProposalBanner`, exibido na página de detalhe do item quando `reviewStatus === "proposed"`, mostrando a `rationale`, o autor (`proposedBy`) e ações explícitas de aceitar/rejeitar — nenhuma skill consegue, por si só, mover um item para `reviewStatus: "accepted"` (o limite de segurança central da seção 5 continua valendo: agentes propõem, o founder dispõe).
- Duas skills de referência foram implementadas em `scripts/skills/`, seguindo o contrato da seção 4 e rodando como processos externos ao BusinessOS (seção 1) — scripts TypeScript executados com `tsx`, que consomem `GET /api/context` e `POST /api/agent/write` via HTTP, sem importar `lib/content.ts` diretamente:
  - `scripts/skills/shared.ts` — helpers `fetchContext` e `proposeWrite` reutilizados pelas duas skills, com os tipos mínimos de `ContentItem`/`BusinessContext` declarados localmente (o script roda fora do processo Next.js).
  - `scripts/skills/mapa-do-mercado.ts` (`agent: "skill:mapa-do-mercado"`) — propõe um esqueleto estruturado de Mapa do Mercado ("Tamanho do mercado", "Tendências", "Concorrentes diretos", "Concorrentes indiretos", "Dinâmica competitiva"), cada seção com bullets-placeholder. Não pesquisa o mercado nem chama nenhuma API de IA — valida apenas o fluxo propor → revisar → aceitar. Executar com `npm run skill:mapa-do-mercado`.
  - `scripts/skills/tese-de-valor.ts` (`agent: "skill:tese-de-valor"`) — propõe um esqueleto de Tese de Valor ("Hipótese central", "Por que este cliente pagaria", "Evidência hoje", "Riscos da hipótese"), lendo também `direcao/perfil-ideal-de-cliente` e `direcao/mapa-de-problemas` como `relatedContext` (seção 4) para incluir avisos no `rationale` quando esses itens ainda parecem não preenchidos (heurística simples: corpo com menos de 200 caracteres). Executar com `npm run skill:tese-de-valor`.
  - Ambos os scripts dependem do servidor Next.js rodando em `http://localhost:3000` (configurável via `BUSINESSOS_URL`) para funcionar ponta a ponta; sem o servidor no ar, falham de forma controlada ao chamar `fetch`.
- `tsx` foi adicionado como devDependency (`package.json`) para permitir rodar os scripts `.ts` diretamente via `npm run skill:*`, sem passo de build separado.
- **Fase 3 (agentes autônomos, permissões granulares por agente/skill, autenticação) continua não implementada** — a invocação das skills desta fase é sempre manual (Felipe rodando `npm run skill:*`), não há orquestração autônoma, nem sistema de permissões por agente/skill (qualquer `agent` pode propor mudança em qualquer `category`/`slug` existente — `proposeChange` só valida que o item existe, não que o chamador tem permissão sobre ele), nem autenticação nas rotas.
