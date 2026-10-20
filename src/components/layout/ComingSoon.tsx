import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/ui/Feedback";

/**
 * Starter-only placeholder for routes that a later build phase replaces.
 * Delete this file once every route is built (docs/PROMPTS.md, Phase 6).
 */
export function ComingSoon({ screen, phase }: { screen: string; phase: number }) {
  return (
    <EmptyState icon={Hammer} title={screen}>
      This screen is built in Phase {phase} (see docs/PROMPTS.md).
    </EmptyState>
  );
}
