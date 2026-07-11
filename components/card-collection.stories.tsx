import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardCollection } from "@/components/card-collection";
import type { ContentItem } from "@/lib/content";

const sampleItems: ContentItem[] = [
  {
    title: "Objetivo",
    slug: "objetivo",
    category: "founder",
    order: 1,
    summary: "Onde eu quero chegar com este negócio nos próximos anos.",
    status: "in_progress",
    updatedAt: "2026-07-01",
    body: "",
  },
  {
    title: "Mapa do Mercado",
    slug: "mapa-do-mercado",
    category: "founder",
    order: 2,
    summary: "Tamanho, dinâmica e concorrência do mercado em que você vai atuar.",
    status: "not_started",
    updatedAt: "2026-06-20",
    body: "",
  },
  {
    title: "Perfil Ideal de Cliente",
    slug: "perfil-ideal-de-cliente",
    category: "founder",
    order: 3,
    summary: "Quem é o cliente que mais se beneficia da oferta e paga por ela.",
    status: "done",
    updatedAt: "2026-05-15",
    body: "",
  },
  {
    title: "Tese de Valor",
    slug: "tese-de-valor",
    category: "founder",
    order: 4,
    summary: "Por que este produto, para este cliente, agora.",
    status: "in_progress",
    updatedAt: "2026-07-05",
    body: "",
  },
  {
    title: "Fluxo de Caixa",
    slug: "fluxo-de-caixa",
    category: "founder",
    order: 5,
    summary: "Entradas, saídas e saldo projetado dos próximos meses.",
    status: "not_started",
    updatedAt: "2026-04-30",
    body: "",
  },
];

const meta: Meta<typeof CardCollection> = {
  title: "BusinessOS/CardCollection",
  component: CardCollection,
  parameters: {
    nextjs: { appDirectory: true },
    layout: "padded",
  },
  args: {
    items: sampleItems,
    category: "founder",
  },
};

export default meta;
type Story = StoryObj<typeof CardCollection>;

// CardCollection controla o modo grid/lista internamente (estado local
// hidratado a partir do localStorage por categoria) via o <ViewToggle>
// renderizado dentro dele — não há prop de view exposta para controle
// direto via args. Cada story abaixo usa uma `category` própria para não
// compartilhar a preferência de visualização persistida no localStorage,
// e o usuário pode alternar grid/lista clicando no seletor "Grade/Lista"
// renderizado no canto superior direito do componente.

export const Grid: Story = {
  args: {
    category: "founder-grid-demo",
  },
};

export const List: Story = {
  args: {
    category: "founder-list-demo",
  },
  decorators: [
    (Story, context) => {
      // CardCollection hidrata seu modo de visualização a partir do
      // localStorage (chave `businessos:view:<category>`) em um efeito no
      // mount. Pré-preenchemos essa chave aqui, antes do mount do
      // componente, para forçar o estado "list" nesta story sem precisar
      // de uma prop de view exposta (o componente não expõe uma).
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          `businessos:view:${context.args.category}`,
          "list"
        );
      }
      return <Story />;
    },
  ],
};

export const Empty: Story = {
  args: {
    items: [],
    category: "founder-empty-demo",
  },
};
