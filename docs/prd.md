# PRD — BusinessOS

**Subtítulo do produto:** "Pra quem está começando do zero."

**Versão do documento:** 1.0 (v1 / MVP)
**Data:** 2026-07-11
**Autor:** Felipe Queiroz (founder solo)
**Status:** Rascunho para implementação

---

## 1. Objetivo do produto

BusinessOS é um "sistema operacional" pessoal para o negócio de um founder solo. Ele funciona como a camada de inteligência e apoio à tomada de decisão do negócio: um lugar único onde o founder estrutura, revisita e evolui o conhecimento fundamental sobre si mesmo, sobre a direção estratégica, sobre a validação do que está construindo e sobre a saúde financeira (caixa) do negócio.

O objetivo central da v1 é dar estrutura e persistência a esse conhecimento — hoje disperso em notas soltas, cadernos e na cabeça do founder — organizando-o em quatro seções fixas, cada uma com itens de conteúdo editáveis. Cada item é salvo como um arquivo Markdown com frontmatter YAML, para que:

1. O founder tenha uma interface simples e agradável para ler e editar esse conteúdo hoje.
2. O mesmo conteúdo já esteja em um formato (Markdown + frontmatter) que agentes de IA e "skills" possam ler — e, no futuro, escrever — para colaborar ativamente com o founder em cada seção do negócio.

BusinessOS não é um CRM, não é uma ferramenta de gestão de projetos genérica e não é um dashboard financeiro completo. É a camada de contexto e clareza que fica embaixo dessas ferramentas, respondendo à pergunta: "o que eu sei, hoje, sobre o meu negócio — e onde isso está escrito?"

## 2. Persona / usuário-alvo

**Persona única: o founder solo em fase inicial.**

- Está começando um negócio do zero, sozinho, sem cofundadores nem equipe.
- Está em fase pré-receita ou de receita muito inicial.
- Não tem tempo nem necessidade de ferramentas corporativas complexas (Notion elaborado, CRMs pesados, planilhas financeiras enterprise).
- Pensa em texto e listas curtas, não em tabelas densas.
- Já usa (ou pretende usar) agentes de IA como parte do seu fluxo de trabalho e quer que seu negócio seja "legível" por esses agentes no futuro.
- Valoriza clareza visual, minimalismo e velocidade — não quer fricção para registrar ou revisar uma ideia.
- É tecnicamente capaz (o próprio usuário é o desenvolvedor do produto), mas quer usar o produto como usuário final no dia a dia, não só como código.

Na v1, existe apenas um usuário (o próprio Felipe, rodando localmente). Não há multiusuário nem autenticação — ver seção "Fora de escopo".

## 3. Arquitetura de informação

Quatro seções fixas, cada uma é uma página própria na navegação. Cada seção contém uma lista fixa de itens; cada item é um "registro de conteúdo" editável e persistido como um arquivo `.md` individual.

1. **Founder**
   - Objetivo
   - Estilo de vida
2. **Direção**
   - Mapa do Mercado
   - Mapa de Problemas
   - Perfil Ideal de Cliente
   - Tese de Valor
   - Oferta
3. **Validação**
   - Oferta
   - Primeiros clientes
4. **Caixa**
   - Fluxo de Caixa
   - ERP

Observação: "Oferta" aparece tanto em Direção quanto em Validação. São itens distintos (arquivos distintos, com slugs diferentes por seção — ex. `direcao-oferta.md` e `validacao-oferta.md`), representando o mesmo conceito visto em dois estágios: a formulação estratégica da oferta (Direção) e a validação prática dela no mercado (Validação). Essa distinção deve ficar clara na UI (ex. breadcrumb com o nome da seção).

## 4. Modelo de conteúdo (registro de item)

Cada item, em qualquer seção, é tratado como um registro de conteúdo com os seguintes campos:

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `title` | string | sim | Nome do item (ex. "Mapa de Mercado"). Pré-preenchido a partir do esboço, editável. |
| `summary` | string curta (1–2 linhas) | não | Resumo/tagline do item, exibido nos cards da visão em grid/lista. |
| `status` | enum | sim | Um dos: `não iniciado`, `em andamento`, `concluído`. Default: `não iniciado`. |
| `updated_at` | data/hora (ISO 8601) | sim (automático) | Atualizada automaticamente a cada salvamento. Não editável manualmente. |
| `body` | Markdown (texto longo) | não | Corpo principal do conteúdo, em Markdown, editado em um editor de texto/textarea com suporte a Markdown. É onde o founder de fato escreve o conteúdo estruturado do negócio. |

Esses campos compõem o frontmatter YAML + corpo do arquivo `.md`. Exemplo de arquivo persistido:

```markdown
---
title: "Mapa de Mercado"
section: "direcao"
slug: "mapa-do-mercado"
summary: "Onde meu negócio se encaixa e quem já disputa esse espaço."
status: "em andamento"
updated_at: "2026-07-11T14:32:00-03:00"
---

## Tamanho do mercado
...

## Concorrentes diretos
...
```

Campos adicionais de identidade (`section`, `slug`) fazem parte do frontmatter mas não são editáveis pelo usuário — são derivados da posição do item na arquitetura de informação fixa.

## 5. Requisitos funcionais por página

### 5.1 Estrutura geral de cada página de seção

Cada uma das 4 páginas de seção (Founder, Direção, Validação, Caixa) segue o mesmo padrão:

- Título da seção no topo (ex. "Direção").
- Um seletor (`select`) no topo da página para alternar a visualização entre **Grade (grid)** e **Lista**. A escolha do usuário é lembrada por sessão (ex. em estado local ou `localStorage`), aplicando-se por página ou globalmente (decisão de implementação: pode ser global para simplicidade da v1).
- Os itens da seção são exibidos como **cards** — nunca como tabela — tanto na visão em grade quanto na visão em lista (a lista é uma variação de layout dos mesmos cards: cards menores/horizontais empilhados verticalmente, em vez de cards em colunas).
- Cada card exibe: título do item, resumo (`summary`, se houver), badge/indicador de `status`, e a data da última atualização (`updated_at`, formatada de forma relativa/legível, ex. "atualizado há 2 dias").
- Clicar em qualquer parte do card leva à página de detalhe/edição daquele item.

### 5.2 Página "Founder"

Itens:
- **Objetivo** — corpo em Markdown para o founder descrever seu objetivo pessoal e/ou do negócio (por que está construindo isso, aonde quer chegar).
- **Estilo de vida** — corpo em Markdown para descrever o estilo de vida desejado (rotina, renda alvo, tempo dedicado, restrições pessoais) que o negócio precisa sustentar.

Ambos seguem o modelo de registro padrão (título, resumo, corpo, status, data de atualização).

### 5.3 Página "Direção"

Itens:
- **Mapa do Mercado** — corpo em Markdown para mapear o mercado: tamanho, tendências, concorrentes, dinâmica competitiva.
- **Mapa de Problemas** — corpo em Markdown para listar e priorizar os problemas identificados que o negócio pode resolver.
- **Perfil Ideal de Cliente** — corpo em Markdown descrevendo o ICP (Ideal Customer Profile): características, contexto, dores, comportamento de compra.
- **Tese de Valor** — corpo em Markdown com a hipótese central de valor: por que esse cliente pagaria por essa solução.
- **Oferta** (Direção) — corpo em Markdown descrevendo a formulação estratégica da oferta: o que está sendo vendido, para quem, em que formato, a que preço (nível de hipótese/design da oferta).

### 5.4 Página "Validação"

Itens:
- **Oferta** (Validação) — corpo em Markdown para registrar o estado de validação prática da oferta: testes feitos, versões, ajustes após conversas reais com o mercado. Distinto do item "Oferta" de Direção (ver seção 3).
- **Primeiros clientes** — corpo em Markdown para registrar aprendizados, feedback e status dos primeiros clientes/usuários (não é um CRM — é um registro qualitativo de aprendizado, não uma lista estruturada de contatos).

### 5.5 Página "Caixa"

Itens:
- **Fluxo de Caixa** — corpo em Markdown para registrar o estado e a lógica do fluxo de caixa do negócio (entradas, saídas, runway, premissas). Na v1 este é um campo de texto estruturado em Markdown, não uma planilha ou integração financeira real.
- **ERP** — corpo em Markdown para anotações sobre ferramentas/processos de ERP, faturamento e operações financeiras/administrativas que o founder está usando ou avaliando.

### 5.6 Navegação (sidebar)

- Sidebar lateral fixa, sempre visível, com os 4 links de seção: Founder, Direção, Validação, Caixa.
- Cada item da sidebar tem efeito de **hover** com destaque de fundo (background highlight) ao passar o mouse.
- O item correspondente à página ativa é destacado visualmente (estado "ativo" distinto do hover).
- Nome do produto ("BusinessOS") e subtítulo ("Pra quem está começando do zero.") exibidos no topo da sidebar ou no cabeçalho principal.
- Sidebar não tem submenu para os itens individuais (Objetivo, Estilo de Vida, etc.) — a navegação para itens acontece dentro da página de seção, via cards.

### 5.7 Visualização em grid/lista

- Um `<Select>` (componente shadcn/ui) no topo de cada página de seção com duas opções: "Grade" e "Lista".
- **Grade**: cards organizados em colunas responsivas (ex. 1 coluna em mobile, 2–3 em desktop), com altura uniforme, ênfase visual no título e no resumo.
- **Lista**: cards empilhados verticalmente, ocupando a largura total, com layout mais compacto/horizontal (título, resumo, status e data numa única linha ou em duas linhas).
- Nunca usar `<table>` para exibir os itens — requisito explícito de design.

### 5.8 Página de detalhe/edição de item

Cada item (ex. "Mapa do Mercado") tem sua própria página de detalhe, acessível por rota própria (ex. `/direcao/mapa-do-mercado`).

A página de detalhe contém:
- Breadcrumb ou indicação clara da seção pai (ex. "Direção / Mapa do Mercado").
- Campo de edição de **título** (input de texto).
- Campo de edição de **resumo** (input de texto curto).
- Seletor de **status** (`não iniciado` / `em andamento` / `concluído`).
- Exibição (somente leitura) da **data da última atualização**.
- Editor de **corpo em Markdown**: um textarea (ou editor Markdown simples, ex. com preview) onde o founder escreve o conteúdo livre da seção. Na v1, um textarea de Markdown puro com um toggle de preview renderizado é suficiente — não é necessário um editor WYSIWYG completo.
- Botão de **Salvar** (pill/rounded-full, conforme design system), que persiste as alterações.
- Feedback visual de salvamento (ex. toast de confirmação "Salvo" ou estado "Salvando..." → "Salvo às HH:MM").
- Estado de "alterações não salvas" (ex. indicador visual sutil ou aviso ao tentar sair da página com alterações pendentes) — desejável, não obrigatório na v1.

**Persistência sem banco de dados:**
- Não há banco de dados na v1. Os dados vivem como arquivos `.md` no repositório (ex. em `content/founder/objetivo.md`, `content/direcao/mapa-do-mercado.md`, etc., um diretório por seção).
- A leitura de conteúdo para renderizar páginas de seção e de detalhe é feita no servidor (Server Components do Next.js App Router), lendo os arquivos `.md` do disco e parseando o frontmatter YAML.
- A escrita (salvar edições) é feita via uma **API route** do Next.js (ex. `app/api/items/[section]/[slug]/route.ts`, método `PUT`/`POST`), que:
  1. Recebe os campos editados (título, resumo, status, corpo) do formulário no cliente.
  2. Atualiza `updated_at` para o timestamp atual no servidor.
  3. Serializa novamente o frontmatter YAML + corpo Markdown.
  4. Sobrescreve o arquivo `.md` correspondente no disco.
  5. Retorna sucesso/erro para o cliente atualizar a UI.
- Como não há banco, não há histórico de versões nem colaboração concorrente na v1 — o arquivo local é a única fonte de verdade, e a aplicação assume um único processo/usuário editando por vez (adequado ao uso local por um founder solo).

## 6. Requisitos não funcionais

- **Stack:** Next.js (App Router, TypeScript), shadcn/ui como biblioteca de componentes, Tailwind CSS para estilização, Storybook para desenvolvimento e documentação de componentes isolados.
- **Design visual:**
  - Paleta estritamente preto e branco (tons de cinza permitidos para hierarquia/hover/bordas), sem cores de destaque na v1.
  - Fonte: Inter em toda a interface.
  - Bordas arredondadas em cards, inputs e containers.
  - Botões no padrão pill / totalmente arredondado (`rounded-full`).
  - Estética minimalista: espaçamento generoso, hierarquia tipográfica clara, ausência de elementos decorativos supérfluos.
- **Responsividade:** interface utilizável em desktop (uso primário) e adaptável a telas menores (a grade de cards deve colapsar para menos colunas).
- **Performance:** leitura de arquivos `.md` local é rápida por natureza (sem rede/banco); páginas devem carregar quase instantaneamente em ambiente local.
- **Componentização:** todo componente visual reutilizável (Card, Sidebar, Select de visualização, Editor Markdown, StatusBadge, etc.) deve ter uma story correspondente no Storybook, permitindo desenvolvimento e revisão isolados.
- **Confiabilidade da escrita em disco:** a API route de salvamento deve tratar erros de escrita (ex. permissão de arquivo, arquivo ausente) e retornar mensagens claras ao cliente, evitando perda silenciosa de dados.
- **Idioma:** interface em português (pt-BR), consistente com o uso pessoal do founder.

## 7. Fora de escopo para v1

Os seguintes itens são explicitamente **fora de escopo** da v1 e não devem ser implementados agora, mas fazem parte da visão futura do produto:

- **Autenticação e login** — v1 roda localmente para um único usuário, sem tela de login.
- **Multiusuário / multi-tenant** — não há conceito de times, convites ou permissões.
- **Banco de dados** — não há Postgres/Supabase na v1; os arquivos `.md` locais são a única fonte de dados.
- **Supabase** — planejado como backend futuro (para persistência em nuvem, sincronização entre dispositivos, autenticação, histórico de versões), mas não implementado na v1.
- **Agentes de IA ativos / skills conectadas** — a visão de longo prazo do BusinessOS é ter múltiplos agentes de IA lendo o conteúdo estruturado (Markdown + frontmatter) de cada seção para colaborar ativamente com o founder (sugerir conteúdo, preencher lacunas, fazer perguntas, analisar consistência entre seções). Na v1, os arquivos apenas *existem em um formato pronto para isso* — nenhum agente é integrado, chamado ou executado pelo produto.
- **Escrita automática por agentes** — na v1, apenas o founder edita os arquivos via UI; agentes não escrevem no conteúdo (isso é visão futura, dependente da infraestrutura de agentes/skills).
- **Histórico de versões / undo** — não há controle de versão de conteúdo além do que o próprio Git do repositório oferece incidentalmente.
- **Edição colaborativa em tempo real** — não relevante para um único usuário local.
- **Integrações financeiras reais** (ex. Open Finance, importação de extratos bancários, ERPs de verdade) — os itens "Fluxo de Caixa" e "ERP" são registros textuais/qualitativos na v1, não integrações.
- **Busca global e comentários** — não incluídos na v1.
- **Exportação/importação em massa** — não incluída na v1 (os arquivos já são acessíveis diretamente no sistema de arquivos, isso é considerado suficiente por ora).

## 8. Critérios de sucesso do MVP

O MVP é considerado bem-sucedido se:

1. O founder consegue, sem ajuda técnica, navegar entre as 4 seções pela sidebar e visualizar os itens de cada uma como cards, alternando entre grid e lista.
2. Todos os 11 itens do esboço original (Objetivo, Estilo de Vida, Mapa do Mercado, Mapa de Problemas, Perfil Ideal de Cliente, Tese de Valor, Oferta [Direção], Oferta [Validação], Primeiros Clientes, Fluxo de Caixa, ERP) existem como páginas de detalhe navegáveis e editáveis.
3. Editar qualquer campo (título, resumo, status, corpo em Markdown) de um item, salvar, recarregar a página e ver o conteúdo persistido corretamente — comprovando que a gravação no arquivo `.md` local funciona de ponta a ponta.
4. Os arquivos `.md` gerados no disco têm frontmatter YAML válido e bem-formado, legível por um parser padrão de frontmatter (ex. `gray-matter`), validando que estão prontos para consumo futuro por agentes de IA.
5. A interface segue consistentemente o design system definido (preto e branco, Inter, bordas arredondadas, botões pill) em todas as páginas, sem uso de tabelas para listar conteúdo.
6. O founder consegue usar o produto diariamente/semanalmente como seu repositório de verdade sobre o estado do negócio, preferindo-o a notas soltas ou documentos avulsos.
7. Os principais componentes (Card, Sidebar, Select de view, Editor) estão documentados como stories no Storybook.

## 9. User stories

- Como founder, quero ver todas as seções do meu negócio organizadas numa sidebar para que eu consiga navegar rapidamente entre Founder, Direção, Validação e Caixa sem me perder.
- Como founder, quero que os itens de cada seção apareçam como cards visuais para que eu tenha uma visão rápida e agradável do estado de cada parte do meu negócio, sem a rigidez de uma tabela.
- Como founder, quero alternar entre visualização em grade e em lista para que eu possa escolher o formato que for mais confortável em cada momento (grade para visão geral, lista para leitura mais densa).
- Como founder, quero que cada item da minha arquitetura de informação tenha sua própria página de edição para que eu possa desenvolver o conteúdo daquele tópico com foco e profundidade.
- Como founder, quero escrever o conteúdo de cada item em Markdown para que eu tenha liberdade de formatação (listas, títulos, ênfases) sem sair de um campo de texto simples.
- Como founder, quero marcar o status de cada item (não iniciado / em andamento / concluído) para que eu saiba, de relance, o que já está maduro e o que ainda precisa de trabalho.
- Como founder, quero que a data da última atualização de cada item seja registrada automaticamente para que eu saiba há quanto tempo não revisito um determinado tópico do meu negócio.
- Como founder, quero salvar minhas edições e ter certeza de que elas foram persistidas em disco para que eu não perca meu trabalho e possa fechar o app com confiança.
- Como founder, quero que meu conteúdo seja salvo como arquivos Markdown com frontmatter para que, no futuro, eu possa conectar agentes de IA que leiam esse contexto e me ajudem ativamente em cada seção do negócio.
- Como founder, quero uma interface minimalista em preto e branco, com bordas arredondadas e botões redondos, para que o ato de registrar meu pensamento seja calmo e sem distração visual.
- Como founder, quero distinguir claramente a "Oferta" que estou desenhando estrategicamente (em Direção) da "Oferta" que estou validando na prática (em Validação) para que eu não confunda hipótese com aprendizado real de mercado.
- Como founder, quero que o BusinessOS funcione hoje sem precisar configurar um banco de dados para que eu possa começar a usá-lo imediatamente, sabendo que a migração para Supabase é um passo futuro e não um bloqueio atual.

---

*Fim do documento.*
