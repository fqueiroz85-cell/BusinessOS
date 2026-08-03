import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ItemReport } from "@/components/item-report";
import type { Question } from "@/lib/questions";

const sampleQuestions: Question[] = [
  {
    id: "porque-agora",
    label: "Por que você está construindo esse negócio, especificamente agora?",
  },
  {
    id: "marco-3-anos",
    label:
      "Em 3 anos, o que precisa ter acontecido para você dizer que valeu a pena?",
  },
  {
    id: "ocupacao",
    label:
      "Esse negócio é para virar sua ocupação principal, uma fonte de renda extra, ou algo que você pretende vender no futuro?",
  },
  {
    id: "ambicao",
    label:
      "Qual é o tamanho de ambição: um negócio enxuto e lucrativo (lifestyle business), ou uma empresa que escala e capta investimento?",
  },
];

const sampleAnswers: Record<string, string> = {
  "porque-agora":
    "Porque identifiquei uma janela de oportunidade clara agora: um problema recorrente no meu antigo mercado de trabalho, sem solução simples disponível hoje.",
  "marco-3-anos":
    "Ter substituído a renda do meu emprego anterior com uma operação que exige no máximo 25h/semana.",
  ocupacao: "Ocupação principal, com a intenção de virar minha única fonte de renda em 12 meses.",
  ambicao: "Um negócio enxuto e lucrativo — prioridade é liberdade de tempo, não crescimento a qualquer custo.",
};

const sampleBriefing =
  "Founder está construindo o negócio agora porque identificou uma **janela de oportunidade clara**: um problema recorrente em seu antigo mercado de trabalho, sem solução simples disponível hoje.\n\nAmbição é de um negócio enxuto e lucrativo (**lifestyle business**), não uma empresa que escala com investimento externo — a prioridade é liberdade de tempo, não crescimento a qualquer custo.\n\nSucesso em 3 anos significa ter substituído a renda do emprego anterior com uma operação que exige no máximo 25h/semana.";

const sampleBody =
  "## Qual é o seu objetivo com esse negócio?\n\nAntes de qualquer estratégia, defina o \"porquê\".\n\n### Perguntas para refletir\n\n- Por que agora, e não há dois anos ou daqui a dois anos?\n- O que você não está disposto a sacrificar no caminho?\n\n### Checklist\n\n- [x] Escrevi o objetivo em uma frase\n- [ ] Compartilhei com alguém de confiança para checar se faz sentido";

const meta: Meta<typeof ItemReport> = {
  title: "BusinessOS/ItemReport",
  component: ItemReport,
  parameters: {
    layout: "padded",
  },
  args: {
    status: "in_progress",
    summary: "Por que esse negócio existe e o que você quer alcançar com ele.",
    body: sampleBody,
    questions: sampleQuestions,
    answers: {},
    onEdit: () => {},
    onAnswerQuestions: () => {},
    onGenerateBriefing: () => {},
    generatingBriefing: false,
    briefingError: null,
  },
};

export default meta;
type Story = StoryObj<typeof ItemReport>;

export const NoAnswersYet: Story = {
  args: {
    answers: {},
  },
};

export const AnsweredNoBriefing: Story = {
  args: {
    answers: sampleAnswers,
  },
};

export const AnsweredWithBriefing: Story = {
  args: {
    answers: sampleAnswers,
    briefing: sampleBriefing,
    briefingGeneratedAt: "2026-07-27T14:32:00.000Z",
  },
};

export const GeneratingBriefing: Story = {
  args: {
    answers: sampleAnswers,
    generatingBriefing: true,
  },
};

export const NoStructuredQuestions: Story = {
  args: {
    questions: [],
    answers: {},
    status: "not_started",
    summary: "Tamanho, dinâmica e concorrência do mercado em que você vai atuar.",
  },
};
