# BusinessOS — Especificação Técnica (v1)

## 1. Visão Geral

BusinessOS é um "sistema operacional" pessoal de negócio para um founder solo (Felipe Queiroz). Funciona como camada de inteligência e apoio à decisão: organiza o raciocínio estratégico e operacional do negócio — do founder à execução — em um único lugar estruturado, legível tanto por humanos quanto, no futuro, por agentes de IA.

O produto é pensado para founders **começando do zero**: a estrutura de informação é o próprio produto. Em vez de um CRM ou uma ferramenta de produtividade genérica, o BusinessOS modela explicitamente as perguntas que um founder solo precisa responder para tirar um negócio do papel — quem eu sou, para onde vou, como valido a ideia, como administro o caixa — e guarda essas respostas como conteúdo versionável.

### 1.1 Princípio central

Todo o conteúdo do negócio é salvo como **arquivos Markdown com frontmatter YAML**. Este é o princípio arquitetural mais importante da v1: cada "item" de conteúdo (ex.: "Objetivo", "Mapa do Mercado") é um arquivo `.md` legível, editável fora do app, e — sobretudo — parseável programaticamente. Isso permite que, no futuro, agentes de IA e "skills" leiam e escrevam esse contexto diretamente, sem precisar de um banco de dados relacional ou de uma API complexa entre eles e o conteúdo.

### 1.2 Escopo da v1

- **Sem banco de dados.** Todo o conteúdo vive em arquivos `.md` dentro do repositório (`content/`).
- Uma **API route local** (Next.js Route Handler) é responsável por reescrever o arquivo `.md` correspondente quando o usuário edita um item pela UI.
- **Supabase** é o backend planejado para uma fase futura (ver seção 9), quando for necessário multiusuário, histórico, ou acesso remoto.
- A UI é minimalista, em preto e branco, com cards (nunca tabelas), grid/lista alternável, e uma página de detalhe/edição por item.

---

## 2. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js (App Router, TypeScript) |
| UI Kit | shadcn/ui |
| Estilização | Tailwind CSS |
| Documentação de componentes | Storybook |
| Parsing de conteúdo | gray-matter (frontmatter YAML + corpo Markdown) |
| Tipografia | Inter, via `next/font` |
| Persistência v1 | Sistema de arquivos local (`content/*.md`) |
| Persistência futura | Supabase (Postgres + Auth + Storage) |

Justificativa das escolhas:

- **Next.js App Router + TypeScript**: permite Server Components para leitura de arquivos no servidor (sem expor o filesystem ao cliente), Route Handlers para a API de escrita, e tipagem estática para o modelo de conteúdo.
- **shadcn/ui**: componentes copiados para o repo (não uma dependência de runtime fechada), o que facilita customização do design system P&B e composição com Tailwind.
- **Storybook**: catálogo isolado dos componentes de UI (Sidebar, Card, ViewToggle etc.), essencial para manter consistência visual à medida que novas seções/páginas forem adicionadas.
- **gray-matter**: biblioteca padrão e madura para separar frontmatter YAML do corpo Markdown; usada tanto para leitura quanto para serialização na escrita.

---

## 3. Estrutura de Pastas

```
businessos/
├── app/
│   ├── layout.tsx                 # layout raiz (fonte Inter, sidebar, tokens)
│   ├── page.tsx                   # / — dashboard
│   ├── founder/
│   │   ├── page.tsx                # listagem em cards (grid/lista)
│   │   └── [slug]/
│   │       └── page.tsx            # detalhe/edição de um item
│   ├── direcao/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── validacao/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   ├── caixa/
│   │   ├── page.tsx
│   │   └── [slug]/page.tsx
│   └── api/
│       ├── content/
│       │   └── [categoria]/
│       │       └── [slug]/
│       │           └── route.ts    # PUT/PATCH — reescreve o .md
│       └── context/
│           └── route.ts            # GET — todo o conteúdo em JSON (agentes de IA)
│
├── components/
│   ├── ui/                         # componentes shadcn/ui (gerados/copiados)
│   ├── sidebar.tsx
│   ├── page-header.tsx
│   ├── card.tsx
│   ├── card-collection.tsx
│   ├── view-toggle.tsx
│   └── markdown-editor.tsx         # editor do corpo markdown na página de detalhe
│
├── content/
│   ├── founder/
│   │   ├── objetivo.md
│   │   └── estilo-de-vida.md
│   ├── direcao/
│   │   ├── mapa-do-mercado.md
│   │   ├── mapa-de-problemas.md
│   │   ├── perfil-ideal-de-cliente.md
│   │   ├── tese-de-valor.md
│   │   └── oferta.md
│   ├── validacao/
│   │   ├── oferta.md
│   │   └── primeiros-clientes.md
│   └── caixa/
│       ├── fluxo-de-caixa.md
│       └── erp.md
│
├── lib/
│   ├── content.ts                  # camada de acesso a dados (ler/escrever .md)
│   ├── categories.ts                # metadados das 4 categorias (label, rota, ícone)
│   └── types.ts                     # tipos: Item, Frontmatter, Category
│
├── docs/
│   └── spec.md                      # este documento
│
├── .storybook/
│   ├── main.ts
│   └── preview.ts
│
├── stories/
│   ├── Sidebar.stories.tsx
│   ├── Card.stories.tsx
│   └── ViewToggle.stories.tsx
│
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 4. Modelo de Conteúdo

### 4.1 Formato do arquivo

Cada item de conteúdo é um único arquivo `.md` com frontmatter YAML delimitado por `---` seguido de um corpo em Markdown livre (o "conteúdo real" que o founder escreve/edita).

```markdown
---
title: "Objetivo"
slug: "objetivo"
category: "founder"
order: 1
summary: "Onde eu quero chegar com este negócio nos próximos anos."
status: "em-andamento"
updatedAt: "2026-07-11T14:32:00.000Z"
---

## Onde eu quero chegar

Descreva aqui o objetivo de longo prazo do founder com o negócio...
```

### 4.2 Campos do frontmatter

| Campo | Tipo | Descrição |
|---|---|---|
| `title` | string | Título exibido nos cards e no cabeçalho da página de detalhe. |
| `slug` | string | Identificador em kebab-case, usado na rota `/[categoria]/[slug]`. Deve bater com o nome do arquivo (sem `.md`). |
| `category` | string | Uma de: `founder`, `direcao`, `validacao`, `caixa`. Deve bater com a subpasta em `content/`. |
| `order` | number | Posição de exibição dentro da categoria (ordenação nos cards). |
| `summary` | string | Resumo curto (1–2 frases), exibido no card da listagem. |
| `status` | string | Estado do item, ex.: `nao-iniciado`, `em-andamento`, `concluido`. Usado para indicadores visuais no card. |
| `updatedAt` | string (ISO 8601) | Timestamp da última edição; atualizado automaticamente pela API de escrita. |

O corpo do markdown (após o segundo `---`) é de conteúdo livre — texto, listas, tabelas markdown quando fizer sentido dentro do próprio conteúdo (não na UI), etc. Não há schema imposto ao corpo: a estrutura fica a critério do founder ou de skills de IA que venham a preenchê-lo.

### 4.3 Mapeamento categoria → arquivos

**`content/founder/`** (seção "Founder")
- `objetivo.md` — Objetivo
- `estilo-de-vida.md` — Estilo de vida

**`content/direcao/`** (seção "Direção")
- `mapa-do-mercado.md` — Mapa do Mercado
- `mapa-de-problemas.md` — Mapa de Problemas
- `perfil-ideal-de-cliente.md` — Perfil Ideal de Cliente
- `tese-de-valor.md` — Tese de Valor
- `oferta.md` — Oferta

**`content/validacao/`** (seção "Validação")
- `oferta.md` — Oferta (validação da oferta com o mercado; arquivo distinto do `direcao/oferta.md` pois vive em outra categoria/pasta, evitando colisão de slug)
- `primeiros-clientes.md` — Primeiros clientes

**`content/caixa/`** (seção "Caixa")
- `fluxo-de-caixa.md` — Fluxo de Caixa
- `erp.md` — ERP

> Nota: como `slug` é único apenas *dentro* da categoria (a rota é `/[categoria]/[slug]`), é seguro repetir o slug `oferta` em `direcao/` e `validacao/` — cada um vive em um caminho de arquivo e URL distintos.

---

## 5. Camada de Acesso a Dados (`lib/content.ts`)

Módulo server-only responsável por toda leitura/escrita de arquivos `.md`. Nunca é importado em Client Components diretamente — é consumido por Server Components (para leitura) e por Route Handlers (para leitura e escrita).

### 5.1 Responsabilidades

- Resolver o caminho de um item a partir de `category` + `slug`.
- Ler um arquivo `.md`, parsear com `gray-matter` e retornar um objeto tipado `Item` (frontmatter + `content` markdown).
- Listar todos os itens de uma categoria, ordenados por `order`.
- Escrever de volta um `Item` editado: serializar frontmatter + corpo com `gray-matter.stringify`, atualizar `updatedAt`, e sobrescrever o arquivo.
- Validar que `category`/`slug` recebidos batem com arquivos existentes (evitar path traversal — nunca interpolar `category`/`slug` vindos da URL diretamente em um caminho de arquivo sem sanitização/whitelist).

### 5.2 Assinatura sugerida

```typescript
// lib/types.ts
export type Category = "founder" | "direcao" | "validacao" | "caixa";

export interface Frontmatter {
  title: string;
  slug: string;
  category: Category;
  order: number;
  summary: string;
  status: "nao-iniciado" | "em-andamento" | "concluido";
  updatedAt: string;
}

export interface Item extends Frontmatter {
  content: string; // corpo markdown, sem o frontmatter
}
```

```typescript
// lib/content.ts
export function getItem(category: Category, slug: string): Item | null;
export function getItemsByCategory(category: Category): Item[];
export function getAllItems(): Item[];
export function saveItem(category: Category, slug: string, data: {
  frontmatter: Partial<Omit<Frontmatter, "slug" | "category" | "updatedAt">>;
  content: string;
}): Item;
```

Implementação de leitura (resumo): `fs.readFileSync` do caminho `content/{category}/{slug}.md` → `matter(raw)` → `{ ...data, content }` tipado como `Item`.

Implementação de escrita (resumo): ler o arquivo atual (para preservar campos não editados), fazer merge do frontmatter, setar `updatedAt = new Date().toISOString()`, gerar string final com `matter.stringify(content, frontmatter)`, e `fs.writeFileSync`.

---

## 6. Rotas

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Página (Server Component) | Dashboard: visão geral das 4 seções, possivelmente com contagem de itens por status. |
| `/founder` | Página | Listagem em cards dos itens de Founder (grid/lista via `ViewToggle`). |
| `/direcao` | Página | Listagem em cards dos itens de Direção. |
| `/validacao` | Página | Listagem em cards dos itens de Validação. |
| `/caixa` | Página | Listagem em cards dos itens de Caixa. |
| `/[categoria]/[slug]` | Página | Detalhe/edição de um item específico. Renderiza título, summary, status e um editor do corpo markdown. Salva via API route. |
| `/api/content/[categoria]/[slug]` | Route Handler (`PUT`/`PATCH`) | Recebe o frontmatter editável + corpo markdown, chama `saveItem`, retorna o `Item` atualizado. |
| `/api/context` | Route Handler (`GET`) | Retorna **todo** o conteúdo estruturado (todas as categorias/itens) como JSON — endpoint pensado para consumo por agentes de IA (ver seção 10). |

Cada página de listagem (`/founder`, `/direcao`, `/validacao`, `/caixa`) chama `getItemsByCategory` no servidor e passa os itens para `<CardCollection>`, que renderiza `<Card>` por item respeitando o modo grid/lista escolhido no `<ViewToggle>`.

A página de detalhe (`/[categoria]/[slug]`) é um Client Component (ou híbrido: Server Component para o fetch inicial + Client Component para o formulário) que mantém estado local do formulário, envia `PUT` para `/api/content/[categoria]/[slug]` ao salvar, e reflete o `updatedAt` retornado.

---

## 7. Design Tokens

### 7.1 Paleta preto e branco

Definida como CSS variables em `app/globals.css`, seguindo a convenção de tokens do shadcn/ui (`--background`, `--foreground`, `--border`, etc.), mas restrita a uma escala de cinza para manter a estética P&B minimalista:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 9%;
  --border: 0 0% 89%;
  --muted: 0 0% 96%;
  --muted-foreground: 0 0% 45%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 100%;
  --ring: 0 0% 9%;
  --radius: 1rem;
}

.dark {
  --background: 0 0% 7%;
  --foreground: 0 0% 96%;
  --card: 0 0% 10%;
  --card-foreground: 0 0% 96%;
  --border: 0 0% 20%;
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 63%;
  --primary: 0 0% 96%;
  --primary-foreground: 0 0% 9%;
  --ring: 0 0% 82%;
}
```

Sem cores de destaque (accent) na v1 — estados (`status`) são comunicados por peso tipográfico, ícones outline ou opacidade, não por cor.

### 7.2 Tipografia

Fonte **Inter**, carregada via `next/font/google` no `app/layout.tsx`:

```typescript
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```

Aplicada globalmente via classe no `<html>`/`<body>`, referenciada em `tailwind.config.ts` como `fontFamily.sans`.

### 7.3 Raio de borda ("bordas arredondadas, botões redondos")

Escala baseada em `--radius` (1rem como base), com variantes derivadas — consistente com o padrão shadcn/ui (`calc(var(--radius) - 2px)` etc.):

| Token Tailwind | Uso |
|---|---|
| `rounded-lg` (`--radius`) | Cards, inputs, containers. |
| `rounded-xl` / `rounded-2xl` | Cards de destaque, painéis maiores. |
| `rounded-full` | Botões de ação (botões redondos), avatares, badges de status. |

Botões primários e ícones de ação usam `rounded-full` explicitamente para reforçar a diretriz de "botões redondos"; cards e inputs usam a escala `--radius` padrão.

---

## 8. Arquitetura de Componentes

Componentes de aplicação vivem em `components/`; componentes shadcn/ui "crus" (gerados via CLI) vivem em `components/ui/` e são a base sobre a qual os componentes de aplicação são compostos.

### 8.1 `Sidebar`

- Navegação persistente com os 4 links de seção (Founder, Direção, Validação, Caixa) + link para o Dashboard.
- Item ativo destacado por peso de fonte/borda (não cor).
- **Hover de fundo**: cada item de navegação recebe um background sutil (`hover:bg-muted`) ao passar o mouse, com transição suave (`transition-colors`).
- Ícones outline minimalistas por seção (ex.: `lucide-react`, já uma dependência comum em projetos shadcn/ui).

### 8.2 `PageHeader`

- Cabeçalho reutilizável de página: título da seção/item, subtítulo/summary opcional, e slot de ações à direita (ex.: `ViewToggle` na listagem, botão "Salvar" no detalhe).

### 8.3 `Card`

- Card único de item: título, summary truncado, badge de status, timestamp de `updatedAt` relativo ("editado há 3 dias").
- Duas variantes de layout controladas por prop (`variant: "grid" | "list"`), consumidas pelo `ViewToggle`/`CardCollection`.
- Nunca renderiza tabelas — toda listagem de dados usa este componente.
- Clicável (Link do Next.js) para `/[categoria]/[slug]`.

### 8.4 `ViewToggle`

- Alterna o modo de exibição da listagem entre grid e lista.
- Implementado com o componente `Select` do shadcn/ui (dropdown com as opções "Grade" / "Lista"), conforme decisão de produto — não um par de ícones toggle, para manter consistência com o restante da UI baseada em primitives shadcn/ui.
- Estado sincronizado com a URL via query param (`?view=grid|list`) para persistir a preferência ao navegar/recarregar, e opcionalmente espelhado em `localStorage`.

### 8.5 `CardCollection`

- Recebe a lista de `Item[]` e o modo de visualização (via `ViewToggle`/query param) e renderiza o grid CSS (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) ou a pilha vertical de `Card`s.
- Responsável apenas por layout — não busca dados (isso é feito pela página, no servidor).

---

## 9. Plano do Storybook

Storybook documenta e isola os componentes de UI reutilizáveis, permitindo desenvolver e revisar estados visuais (hover, ativo, grid vs. lista, status) sem depender do conteúdo real em `content/`.

Configuração em `.storybook/main.ts` apontando para `stories/**/*.stories.tsx` e `components/**/*.stories.tsx`, com o addon do Tailwind configurado para carregar `app/globals.css` (tokens de design) no preview.

### 9.1 Stories planejadas

**`Sidebar.stories.tsx`**
- `Default` — sidebar com item "Founder" ativo.
- `HoverState` — captura visual do estado de hover em um item não ativo.
- `AllSections` — variando qual seção está ativa (Founder/Direção/Validação/Caixa).

**`Card.stories.tsx`**
- `GridVariant` — card isolado no layout de grid.
- `ListVariant` — card isolado no layout de lista.
- `StatusVariants` — três stories (ou um controle de `args`) para `nao-iniciado`, `em-andamento`, `concluido`.
- `LongTitleOverflow` — teste visual de truncamento de título/summary longos.

**`ViewToggle.stories.tsx`**
- `Default` — estado inicial (grid selecionado).
- `ListSelected` — com "Lista" selecionado.
- `Interactive` — story com `play` function (Storybook interactions) simulando a troca de valor no `Select`.

Convenção: cada componente novo em `components/` (fora de `components/ui/`, que é gerado) deve vir acompanhado de um arquivo `.stories.tsx` correspondente em `stories/` antes de ser considerado "pronto".

---

## 10. Integração Futura: Supabase

Quando a v1 baseada em arquivos deixar de ser suficiente (multiusuário, colaboração, acesso fora do filesystem local, necessidade de histórico/auditoria), o backend migra para **Supabase** (Postgres gerenciado + Auth + Storage), mantendo o mesmo modelo conceitual de frontmatter.

### 10.1 Esboço de schema

```sql
-- Um founder pode ter mais de um negócio no futuro (hoje: 1:1 com o usuário)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cada linha espelha um arquivo .md: frontmatter vira colunas, corpo vira "content"
create table items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  category text not null check (category in ('founder', 'direcao', 'validacao', 'caixa')),
  slug text not null,
  title text not null,
  "order" integer not null default 0,
  summary text,
  status text not null default 'nao-iniciado'
    check (status in ('nao-iniciado', 'em-andamento', 'concluido')),
  content text not null default '',       -- corpo markdown
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, category, slug)
);
```

Notas de migração:
- A dupla `(category, slug)` no arquivo vira a chave de unicidade `(business_id, category, slug)` na tabela — preservando a mesma lógica de endereçamento usado nas rotas `/[categoria]/[slug]`.
- `lib/content.ts` seria substituído (ou estendido, via *feature flag*) por um adapter equivalente sobre o client Supabase, mantendo a mesma interface (`getItem`, `getItemsByCategory`, `saveItem`) para minimizar mudanças nas páginas/rotas que já o consomem — a UI não deve saber se está lendo de arquivo ou de banco.
- Um script de migração único (`scripts/migrate-to-supabase.ts`) percorreria `content/**/*.md`, parsearia com `gray-matter` e faria `insert` em `items`, preservando `updatedAt` original.
- Auth do Supabase abriria caminho para multiusuário: `businesses.owner_id` já modela isso desde o desenho inicial do schema, mesmo que a v1 (arquivos) não tenha conceito de usuário algum.

---

## 11. Integração Futura: Agentes de IA e Skills

A escolha de Markdown + frontmatter YAML como formato de conteúdo não é incidental: é o que torna o BusinessOS legível por agentes de IA sem precisar de uma camada de tradução. A visão de produto é ter **múltiplos agentes/skills conectados ao sistema**, cada um lendo e/ou escrevendo pedaços específicos desse conteúdo.

### 11.1 `/api/context`

Route Handler `GET` que expõe **todo** o conteúdo estruturado do negócio como um único JSON, agregando todas as categorias e itens (frontmatter + corpo):

```jsonc
// GET /api/context
{
  "business": "Felipe Queiroz",
  "generatedAt": "2026-07-11T14:32:00.000Z",
  "categories": {
    "founder": [ { "slug": "objetivo", "title": "Objetivo", "summary": "...", "status": "em-andamento", "content": "..." }, ... ],
    "direcao": [ ... ],
    "validacao": [ ... ],
    "caixa": [ ... ]
  }
}
```

Esse endpoint é o ponto de entrada canônico para qualquer agente externo (ou skill interna) que precise de contexto de negócio completo antes de raciocinar — por exemplo, um agente que sugere próximos passos de validação com base no que já está preenchido em `direcao/` e vazio em `validacao/`.

Na v1, este endpoint é somente leitura. Uma versão futura pode aceitar filtros por categoria/status (`?category=direcao`) para reduzir payload.

### 11.2 Conceito de "skill"

Uma **skill**, neste contexto, é uma capacidade plugável — tipicamente um agente ou fluxo de IA especializado — com permissão para ler e/ou escrever um subconjunto específico de arquivos de conteúdo. Exemplos ilustrativos (não implementados na v1):

- **Skill "Mapa de Mercado"**: lê `direcao/mapa-do-mercado.md`, pesquisa concorrentes, propõe atualização do corpo markdown via `saveItem`.
- **Skill "Fluxo de Caixa"**: lê `caixa/fluxo-de-caixa.md` e `caixa/erp.md`, cruza com dados externos (ex.: extrato bancário), e escreve um resumo mensal de volta no corpo do item.
- **Skill "Coach de Validação"**: lê `validacao/*` e `direcao/oferta.md` via `/api/context`, e sugere (mas não escreve automaticamente) próximos experimentos.

Cada skill deve declarar, no mínimo: quais `category`/`slug` pode ler, quais pode escrever, e se a escrita requer confirmação humana antes de sobrescrever o arquivo. Essa permissão granular por item é justamente o que o modelo `category/slug` (arquivo por item) viabiliza: não é preciso dar a uma skill acesso a todo o repositório de conteúdo para que ela seja útil em um domínio específico.

> **Nota (superado):** esta seção descrevia a intenção original de que skills reaproveitassem a mesma rota de escrita da UI. Isso foi revisto na Fase 2 da implementação. Hoje existem **dois caminhos de escrita distintos** — `POST /api/content` (humano, via UI) e `POST /api/agent/write` (agente, que grava uma proposta pendente em vez de sobrescrever o conteúdo) —, ambos apoiados na mesma função `saveItem`/`proposeChange` de `lib/content.ts`, que continua sendo a fonte única da verdade para persistência. Separar os caminhos é o que torna possível distinguir uma escrita humana de uma proposta de agente e exigir revisão explícita antes de qualquer mudança feita por IA. Ver `docs/agents-integration.md` (seções 3 e 5) para o desenho atual, e a seção 11 do mesmo documento para o sistema de permissões por agente.

---

## 12. Resumo das Decisões-Chave

- Conteúdo = arquivos `.md` com frontmatter YAML, um arquivo por item, agrupados por categoria em `content/`.
- Sem banco na v1; leitura/escrita via filesystem, abstraída em `lib/content.ts`.
- 4 categorias fixas (`founder`, `direcao`, `validacao`, `caixa`), cada uma com sua própria listagem em cards e detalhe/edição por slug.
- UI minimalista P&B, Inter, cantos arredondados, botões redondos, cards (nunca tabelas), grid/lista via `Select` do shadcn/ui.
- Storybook cobre os componentes estruturais (`Sidebar`, `Card`, `ViewToggle`) desde o início.
- Supabase e agentes de IA são extensões planejadas, desenhadas para se encaixar no mesmo modelo de dados (`category`/`slug`/frontmatter) sem exigir reescrita da camada de apresentação.
