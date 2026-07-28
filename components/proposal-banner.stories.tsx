import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProposalBanner } from "@/components/proposal-banner";

// ProposalBanner não recebe callbacks — ele mesmo dispara um
// `fetch("/api/agent/review", ...)` internamente ao aceitar/rejeitar.
// Não há requisição real de rede disponível no Storybook, então o clique
// em "Aceitar"/"Rejeitar" aqui resultará no estado de erro tratado pelo
// próprio componente, o que também é útil para visualizar esse estado.

const meta: Meta<typeof ProposalBanner> = {
  title: "BusinessOS/ProposalBanner",
  component: ProposalBanner,
  parameters: {
    layout: "padded",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/direcao/mapa-do-mercado",
      },
    },
  },
  args: {
    category: "direcao",
    slug: "mapa-do-mercado",
    proposedBy: "skill:mapa-do-mercado",
    proposedAt: "2026-07-27T14:32:00.000Z",
    proposedRationale:
      "Encontrei um relatório setorial mais recente (IBGE + Sebrae, jun/2026) com números atualizados de TAM/SAM/SOM e um concorrente novo que entrou no mercado nos últimos 3 meses.",
    currentSummary:
      "Tamanho, dinâmica e concorrência do mercado em que você vai atuar.",
    currentBody:
      "## Tamanho do mercado\n\nTAM estimado em R$ 40M/ano com base em dados de 2024.\n\n## Concorrência\n\nDois concorrentes diretos identificados.",
  },
};

export default meta;
type Story = StoryObj<typeof ProposalBanner>;

export const SummaryAndBody: Story = {
  args: {
    proposedSummary:
      "Tamanho, dinâmica e concorrência do mercado, atualizados com dados do relatório setorial de 2026.",
    proposedBody:
      "## Tamanho do mercado\n\nTAM estimado em R$ 58M/ano com base no relatório setorial de 2026 (IBGE + Sebrae).\n\n## Concorrência\n\nTrês concorrentes diretos identificados, incluindo um novo entrante focado no mesmo segmento.",
  },
};

export const SummaryOnly: Story = {
  args: {
    proposedSummary:
      "Tamanho, dinâmica e concorrência do mercado, atualizados com dados do relatório setorial de 2026.",
  },
};

export const BodyOnly: Story = {
  args: {
    proposedBody:
      "## Tamanho do mercado\n\nTAM estimado em R$ 58M/ano com base no relatório setorial de 2026 (IBGE + Sebrae).\n\n## Concorrência\n\nTrês concorrentes diretos identificados, incluindo um novo entrante focado no mesmo segmento.",
  },
};
