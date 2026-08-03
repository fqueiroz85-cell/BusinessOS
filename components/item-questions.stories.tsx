import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ItemQuestions } from "@/components/item-questions";
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
    id: "ambicao",
    label:
      "Qual é o tamanho de ambição: um negócio enxuto e lucrativo, ou uma empresa que escala e capta investimento?",
  },
];

function ItemQuestionsDemo({
  initialAnswers = {},
}: {
  initialAnswers?: Record<string, string>;
}) {
  const [answers, setAnswers] = useState(initialAnswers);
  return (
    <div className="max-w-2xl">
      <ItemQuestions
        questions={sampleQuestions}
        answers={answers}
        onChange={(id, value) =>
          setAnswers((prev) => ({ ...prev, [id]: value }))
        }
      />
    </div>
  );
}

const meta: Meta<typeof ItemQuestionsDemo> = {
  title: "BusinessOS/ItemQuestions",
  component: ItemQuestionsDemo,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ItemQuestionsDemo>;

export const Empty: Story = {};

export const PartiallyAnswered: Story = {
  args: {
    initialAnswers: {
      "porque-agora":
        "Porque identifiquei um problema real que ninguém está resolvendo bem hoje.",
    },
  },
};
