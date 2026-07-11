import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ItemEditor } from "@/components/item-editor";
import type { ContentItem } from "@/lib/content";

// ItemEditor não recebe callbacks como `onSave` — ele mesmo dispara um
// `fetch("/api/content", ...)` internamente ao salvar. Não há requisição
// real de rede disponível no Storybook, então o clique em "Salvar" aqui
// resultará no estado de erro tratado pelo próprio componente
// ("Não foi possível salvar. Tente novamente."), o que também é útil
// para visualizar esse estado.

const filledItem: ContentItem = {
  title: "Tese de Valor",
  slug: "tese-de-valor",
  category: "direcao",
  order: 4,
  summary: "Por que este produto, para este cliente, agora.",
  status: "in_progress",
  updatedAt: "2026-07-05",
  body: "## Por que agora\n\nO mercado está mudando e existe uma janela de oportunidade clara para resolver este problema.",
};

const emptyItem: ContentItem = {
  title: "",
  slug: "novo-item",
  category: "direcao",
  order: 99,
  summary: "",
  status: "not_started",
  updatedAt: "",
  body: "",
};

const meta: Meta<typeof ItemEditor> = {
  title: "BusinessOS/ItemEditor",
  component: ItemEditor,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/direcao/tese-de-valor",
      },
    },
  },
  args: {
    item: filledItem,
  },
};

export default meta;
type Story = StoryObj<typeof ItemEditor>;

export const Filled: Story = {
  args: {
    item: filledItem,
  },
};

export const Empty: Story = {
  args: {
    item: emptyItem,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/direcao/novo-item",
      },
    },
  },
};
