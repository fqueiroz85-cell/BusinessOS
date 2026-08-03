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

// "objetivo" é um dos itens de Founder com perguntas estruturadas
// configuradas em lib/questions.ts — usada para mostrar a seção de
// Perguntas + Briefing (gerado por IA) dentro do ItemEditor.
const founderItem: ContentItem = {
  title: "Objetivo",
  slug: "objetivo",
  category: "founder",
  order: 1,
  summary: "Por que esse negócio existe e o que você quer alcançar com ele.",
  status: "in_progress",
  updatedAt: "2026-07-11",
  body: "## Qual é o seu objetivo com esse negócio?\n\nAntes de qualquer estratégia, defina o \"porquê\".",
  answers: {
    "porque-agora":
      "Porque identifiquei uma janela de oportunidade clara agora.",
  },
};

// Sem nenhuma resposta ainda — ItemEditor entra no modo onboarding
// (QuestionWizard, uma pergunta por vez) em vez da lista editável.
const freshFounderItem: ContentItem = {
  ...founderItem,
  status: "not_started",
  answers: {},
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

export const WithStructuredQuestions: Story = {
  args: {
    item: founderItem,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/founder/objetivo",
      },
    },
  },
};

export const OnboardingWizard: Story = {
  args: {
    item: freshFounderItem,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/founder/objetivo",
      },
    },
  },
};
