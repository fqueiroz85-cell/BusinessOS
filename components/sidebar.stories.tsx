import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "@/components/sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "BusinessOS/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/direcao",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Overview: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/" } },
  },
};

export const DirecaoActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/direcao" } },
  },
};

export const CaixaActive: Story = {
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: "/caixa" } },
  },
};
