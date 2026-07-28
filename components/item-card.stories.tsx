import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ItemCard } from "@/components/item-card";
import type { ContentItem } from "@/lib/content";

const sampleItem: ContentItem = {
  title: "Mapa do Mercado",
  slug: "mapa-do-mercado",
  category: "direcao",
  order: 1,
  summary: "Tamanho, dinâmica e concorrência do mercado em que você vai atuar.",
  status: "in_progress",
  updatedAt: "2026-07-11",
  body: "",
};

const meta: Meta<typeof ItemCard> = {
  title: "BusinessOS/ItemCard",
  component: ItemCard,
  parameters: {
    nextjs: { appDirectory: true },
    layout: "padded",
  },
  args: {
    item: sampleItem,
    variant: "grid",
  },
};

export default meta;
type Story = StoryObj<typeof ItemCard>;

export const Grid: Story = {
  args: {
    variant: "grid",
  },
};

export const List: Story = {
  args: {
    variant: "list",
  },
};

export const Done: Story = {
  args: {
    variant: "grid",
    item: { ...sampleItem, status: "done", title: "Perfil Ideal de Cliente" },
  },
};

export const NotStarted: Story = {
  args: {
    variant: "grid",
    item: { ...sampleItem, status: "not_started", title: "Fluxo de Caixa" },
  },
};

export const ProposalPending: Story = {
  args: {
    variant: "grid",
    item: {
      ...sampleItem,
      title: "Mapa do Mercado",
      reviewStatus: "proposed",
      proposedBy: "skill:mapa-do-mercado",
      proposedAt: "2026-07-27T14:32:00.000Z",
      proposedRationale:
        "Encontrei um relatório setorial mais recente com números atualizados de TAM/SAM/SOM.",
      proposedSummary:
        "Tamanho, dinâmica e concorrência do mercado, atualizados com dados do relatório setorial de 2026.",
    },
  },
};
