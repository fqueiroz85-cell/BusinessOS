import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QuestionWizard } from "@/components/question-wizard";
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
];

// QuestionWizard não recebe estado inicial de "passo" via props — cada
// story recomeça na primeira pergunta. Use os botões "Avançar"/"Voltar"
// dentro do Storybook para navegar entre as perguntas.
function QuestionWizardDemo() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [finished, setFinished] = useState<"completed" | "skipped" | null>(
    null
  );

  if (finished) {
    return (
      <p className="max-w-md text-sm text-muted-foreground">
        {finished === "completed"
          ? "Wizard concluído — o ItemEditor mostraria agora a lista editável com todas as respostas."
          : "Wizard pulado — o ItemEditor mostraria a lista editável direto."}
      </p>
    );
  }

  return (
    <div className="max-w-xl">
      <QuestionWizard
        questions={sampleQuestions}
        answers={answers}
        onChange={(id, value) =>
          setAnswers((prev) => ({ ...prev, [id]: value }))
        }
        onComplete={() => setFinished("completed")}
        onSkip={() => setFinished("skipped")}
      />
    </div>
  );
}

const meta: Meta<typeof QuestionWizardDemo> = {
  title: "BusinessOS/QuestionWizard",
  component: QuestionWizardDemo,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof QuestionWizardDemo>;

export const Default: Story = {};
