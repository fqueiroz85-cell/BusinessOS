import type { Meta, StoryObj } from "@storybook/react";
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
