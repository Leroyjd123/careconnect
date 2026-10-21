"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Field, TextInput } from "@/components/ui/Field";
import { DURATION_OPTIONS, FREQUENCY_OPTIONS, TIMING_OPTIONS } from "@/lib/constants";
import type { DraftItem } from "@/lib/types";

type MedicineFieldsProps = {
  /** 1-based, shown as "Medicine 1". */
  index: number;
  item: DraftItem;
  onChange: (item: DraftItem) => void;
  /** Left out for the first row when it's the only one. */
  onRemove?: () => void;
  /** id of the shared <datalist> of medicines this doctor has prescribed before. */
  suggestionsId?: string;
};

/** One medicine inside the prescription composer. Quick picks first, "Custom…" when they don't fit. */
export function MedicineFields({ index, item, onChange, onRemove, suggestionsId }: MedicineFieldsProps) {
  const set = (patch: Partial<DraftItem>) => onChange({ ...item, ...patch });
  const id = `medicine-${index}`;

  return (
    <Card tone="solid" as="fieldset" className="flex flex-col gap-4 p-4">
      <legend className="sr-only">Medicine {index}</legend>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-semibold tracking-wider text-ink-label uppercase">Medicine {index}</span>
        {onRemove ? (
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 aria-hidden="true" className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${id}-name`} label="Medicine" hint="Name and strength, e.g. Paracetamol 650 mg">
          <TextInput
            id={`${id}-name`}
            list={suggestionsId}
            value={item.medicine}
            onChange={(e) => set({ medicine: e.target.value })}
            placeholder="Start typing"
            autoComplete="off"
          />
        </Field>
        <Field id={`${id}-dose`} label="Dose" hint="e.g. 1 tablet, 5 ml">
          <TextInput id={`${id}-dose`} value={item.dose} onChange={(e) => set({ dose: e.target.value })} placeholder="1 tablet" />
        </Field>
      </div>

      <ChipGroup
        label="How often"
        options={FREQUENCY_OPTIONS}
        value={item.frequency || null}
        onChange={(frequency) => set({ frequency })}
        allowCustom
        customPlaceholder="e.g. Every 6 hours"
      />
      <ChipGroup
        label="For how long"
        options={DURATION_OPTIONS}
        value={item.duration || null}
        onChange={(duration) => set({ duration })}
        allowCustom
        customPlaceholder="e.g. 10 days"
      />
      <ChipGroup
        label="When to take it"
        options={TIMING_OPTIONS}
        value={item.timing || null}
        onChange={(timing) => set({ timing })}
        allowCustom
        customPlaceholder="e.g. At bedtime"
      />
    </Card>
  );
}
