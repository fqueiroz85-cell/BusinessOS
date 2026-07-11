# BusinessOS

Sistema operacional pessoal para o negócio de um founder solo — uma camada de inteligência e apoio à decisão para quem está começando do zero.

O conteúdo do negócio (objetivo, direção, validação e caixa) é salvo como arquivos Markdown com frontmatter YAML em `/content`. Não há banco de dados nesta versão: os arquivos `.md` locais **são** o banco de dados, e a interface lê e escreve neles através de uma API route local (`app/api/content/route.ts`). Essa estrutura simples também prepara o terreno para que agentes de IA leiam e escrevam esse contexto no futuro.

## Estrutura

- `app/` — rotas do App Router (dashboard, seções Founder/Direção/Validação/Caixa, página de detalhe/edição de item, API route).
- `components/` — sidebar, cards, editor de item e demais componentes de UI (shadcn/ui em `components/ui`).
- `content/` — conteúdo do negócio em Markdown + frontmatter, organizado por categoria.
- `lib/content.ts` — leitura/escrita dos arquivos de conteúdo (`getCategoryItems`, `getItem`, `saveItem`).

## Como rodar

Instale as dependências e suba o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Para rodar o Storybook (catálogo de componentes isolados):

```bash
npm run storybook
```

## Documentação

Contexto de produto e especificação técnica em:

- `docs/briefing.md`
- `docs/prd.md`
- `docs/spec.md`
