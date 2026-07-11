import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeader } from "@/components/page-header";

const meta: Meta<typeof PageHeader> = {
  title: "BusinessOS/PageHeader",
  component: PageHeader,
  parameters: {
    layout: "padded",
  },
  args: {
    title: "Direção",
    subtitle: "Para onde o negócio está indo e por quê.",
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const WithSubtitle: Story = {
  args: {
    title: "Direção",
    subtitle: "Para onde o negócio está indo e por quê.",
  },
};

export const WithoutSubtitle: Story = {
  args: {
    title: "Caixa",
    subtitle: undefined,
  },
};

export const LongTitleAndSubtitle: Story = {
  args: {
    title: "Perfil Ideal de Cliente e Segmentação de Mercado",
    subtitle:
      "Descrição detalhada de quem é o cliente que mais se beneficia da oferta, como ele pensa, e por que ele pagaria por este produto hoje.",
  },
};
