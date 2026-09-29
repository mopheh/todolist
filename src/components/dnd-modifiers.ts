import type { Modifier } from "@dnd-kit/core";

// Inline equivalent of @dnd-kit/modifiers' restrictToVerticalAxis.
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
