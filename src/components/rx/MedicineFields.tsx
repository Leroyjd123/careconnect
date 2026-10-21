"use client";

import { useState } from "react";
import { ListPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Field, TextInput } from "@/components/ui/Field";
import { DURATION_OPTIONS, FREQUENCY_OPTIONS, TIMING_OPTIONS } from "@/lib/constants";
import type { ActionResult, DraftItem, MedicineOption } from "@/lib/types";

type MedicineFieldsProps = {
  /** 1-based, shown as "Medicine 1". */
  index: number;
  item: DraftItem;
  onChange: (item: DraftItem) => void;
  /** Left out for the first row when it's the only one. */
  onRemove?: () => void;
  /** id of the shared <datalist> of medicines this doctor has prescribed before. */
  suggestionsId?: string;
  /** The master list. Picking a name from it fills in its usual dose when the dose is empty. */
  options?: MedicineOption[];
  /** Shows "Save to my medicines" for a typed name that isn't in the master list yet. */
  onSaveToList?: (name: string, dose: string) => Promise<ActionResult<{ id: string }>>;
};

/** One medicine inside the prescription composer. Quick picks first, "Custom…" when they don't fit. */
export function MedicineFields({ index, item, onChange, onRemove, suggestionsId, options = [], onSaveToList }: MedicineFieldsProps) {
  const set = (patch: Partial<DraftItem>) => onChange({ ...item, ...patch });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const typed = item.medicine.trim();
  const known = options.some((o) => o.name.toLowerCase() === typed.toLowerCase());

  function pickName(medicine: string) {
    const match = options.find((o) => o.name.toLowerCase() === medicine.trim().toLowerCase());
    onChange({ ...item, medicine, dose: !item.dose && match?.default_dose ? match.default_dose : item.dose });
    setSaveError(null);
  }

  async function save() {
    if (!onSaveToList) return;
    setSaving(true);
    const result = await onSaveToList(typed, item.dose.trim());
    setSaving(false);
    setSaveError(result.ok ? null : result.error);
  }
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
            onChange={(e) => pickName(e.target.value)}
            placeholder="Start typing"
            autoComplete="off"
          />
        </Field>
        <Field id={`${id}-dose`} label="Dose" hint="e.g. 1 tablet, 5 ml">
          <TextInput id={`${id}-dose`} value={item.dose} onChange={(e) => set({ dose: e.target.value })} placeholder="1 tablet" />
        </Field>
      </div>

      {onSaveToList && typed.length >= 2 && !known ? (
        <div className="-mt-2 flex flex-col gap-1">
          <Button variant="ghost" size="sm" onClick={save} loading={saving} className="self-start">
            <ListPlus aria-hidden="true" className="size-4" />
            Save “{typed}” to my medicines
          </Button>
          {saveError ? <p className="text-[13px] text-danger">{saveError}</p> : null}
        </div>
      ) : null}

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
