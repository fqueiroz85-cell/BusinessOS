import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ItemBriefing } from "@/components/item-briefing";

// ItemBriefing não recebe um handler real de geração no Storybook — os
// cliques em "Gerar briefing" aqui não disparam nenhuma chamada de API.

const meta: Meta<typeof ItemBriefing> = {
  title: "BusinessOS/ItemBriefing",
  component: ItemBriefing,
  parameters: {
    layout: "padded",
  },
  args: {
    onGenerate: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof ItemBriefing>;

export const Empty: Story = {};

export const Generating: Story = {
  args: {
    generating: true,
  },
};

export const Generated: Story = {
  args: {
    briefing:
      "Founder está construindo o negócio agora porque identificou uma janela de oportunidade clara: um problema recorrente em seu antigo mercado de trabalho, sem solução simples disponível hoje.\n\nAmbição é de um negócio enxuto e lucrativo (lifestyle business), não uma empresa que escala com investimento externo — a prioridade é liberdade de tempo, não crescimento a qualquer custo.\n\nSucesso em 3 anos significa ter substituído a renda do emprego anterior com uma operação que exige no máximo 25h/semana.",
    briefingGeneratedAt: "2026-07-27T14:32:00.000Z",
  },
};

export const WithError: Story = {
  args: {
    error: "Não foi possível gerar o briefing. Tente novamente.",
  },
};
