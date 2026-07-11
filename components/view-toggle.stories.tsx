import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ViewToggle, type ViewMode } from "@/components/view-toggle";

function ViewToggleDemo({ initial = "grid" }: { initial?: ViewMode }) {
  const [value, setValue] = useState<ViewMode>(initial);
  return <ViewToggle value={value} onChange={setValue} />;
}

const meta: Meta<typeof ViewToggleDemo> = {
  title: "BusinessOS/ViewToggle",
  component: ViewToggleDemo,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ViewToggleDemo>;

export const Grid: Story = {
  args: {
    initial: "grid",
  },
};

export const List: Story = {
  args: {
    initial: "list",
  },
};
