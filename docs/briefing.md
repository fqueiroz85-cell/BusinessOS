# Briefing de Produto — BusinessOS

> Pra quem está começando do zero.

## Contexto e motivação

Founders solo em fase inicial (pré-receita ou receita muito incipiente) tomam decisões de negócio sem um lugar único onde o conhecimento estruturado sobre o próprio negócio viva, evolua e possa ser reutilizado. Esse conhecimento normalmente fica espalhado — em notas soltas, documentos avulsos, na cabeça do founder — o que dificulta tanto a clareza do próprio founder quanto, mais adiante, a colaboração com ferramentas de IA que poderiam ajudar a construir o negócio.

O BusinessOS nasce dessa lacuna: um espaço pessoal onde Felipe Queiroz (founder solo) organiza o raciocínio do seu negócio de forma estruturada, com a intenção explícita de que esse conteúdo seja, desde o primeiro dia, legível por agentes de IA — não apenas por ele mesmo.

## Visão do produto

BusinessOS é um "sistema operacional" pessoal para o negócio de um founder solo — a camada de inteligência e apoio à tomada de decisão que organiza o conhecimento essencial do negócio em páginas estruturadas. O conteúdo criado no app é salvo como arquivos Markdown com frontmatter YAML, transformando o que hoje é um repositório de conhecimento pessoal na base de contexto que, no futuro, agentes de IA e skills especializadas vão ler (e eventualmente escrever) para colaborar ativamente no desenvolvimento do negócio.

## Para quem é

- **Usuário único**: o próprio founder solo (Felipe Queiroz), sem equipe.
- **Fase do negócio**: zero-to-one — antes de ter receita consistente, ainda validando mercado, problema, cliente e oferta.
- **Uso**: pessoal e individual, não é uma ferramenta multiusuário ou colaborativa entre pessoas (a colaboração pensada é entre o founder e futuros agentes de IA, não entre humanos).

## Princípios de produto

1. **Conteúdo estruturado para IA desde o dia 1**: cada página e cada item é salvo como Markdown + frontmatter YAML, não porque é bonito, mas porque é a interface que agentes de IA vão consumir mais adiante. Estrutura de dados é decisão de arquitetura, não só de apresentação.
2. **Minimalismo radical**: preto e branco, sem cores, tipografia única (Inter), bordas bem arredondadas. A interface não compete com o conteúdo — ela desaparece.
3. **Cards, nunca tabelas**: toda listagem de conteúdo é exibida em cards, com alternância entre visualização em grade e lista via um seletor simples. Tabelas são evitadas propositalmente pela rigidez visual que impõem.
4. **Arquitetura pronta para colaboração com agentes**: mesmo sem agentes ativos na v1, a estrutura de conteúdo (páginas, itens nomeados, frontmatter) e a futura superfície de API são desenhadas pensando em como um agente vai ler e, no futuro, escrever nesse contexto.
5. **Simplicidade de infraestrutura primeiro**: nenhuma dependência de backend é introduzida antes de ser necessária. V1 roda inteiramente sobre arquivos locais.

## Escopo de alto nível

### V1 (esta versão)

- **Sem banco de dados**: todo o conteúdo vive como arquivos `.md` locais no repositório, com frontmatter YAML.
- **Arquitetura de informação em 4 seções**, cada uma como uma página com itens nomeados:
  1. **Founder** — Objetivo, Estilo de vida
  2. **Direção** — Mapa do Mercado, Mapa de Problemas, Perfil Ideal de Cliente, Tese de Valor, Oferta
  3. **Validação** — Oferta, Primeiros clientes
  4. **Caixa** — Fluxo de Caixa, ERP
- **Stack técnica**: Next.js (App Router, TypeScript), shadcn/ui, Tailwind CSS, Storybook para desenvolvimento de componentes.
- **Design**: minimalista, preto e branco, fonte Inter, bordas arredondadas, sidebar de navegação com destaque de hover, conteúdo em cards com seletor grid/lista.
- **Sem agentes ativos**: nenhuma IA opera dentro do produto nesta versão — a v1 entrega a estrutura de conteúdo e a experiência de edição manual.
- **Sem autenticação**: uso local, pessoal, sem login.

### Visão futura (fora do escopo da v1)

- **Múltiplos agentes de IA e skills especializadas** operando dentro do sistema, lendo o contexto de negócio a partir do conteúdo MD/frontmatter de cada seção — por exemplo, um agente que ajuda a construir o Mapa do Mercado, outro que rascunha a Tese de Valor, e assim por diante.
- **Supabase como backend planejado**: persistência em banco de dados, autenticação e sincronização substituindo os arquivos locais — infraestrutura pensada, mas não implementada nesta fase.
- **Escrita por agentes**: hoje os agentes são pensados apenas para leitura de contexto; a evolução natural é permitir que também escrevam/atualizem o conteúdo, sob supervisão do founder.
