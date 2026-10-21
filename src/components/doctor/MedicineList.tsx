"use client";

import { useMemo, useState } from "react";
import { Merge, Pencil, Pill, Plus, Power, PowerOff } from "lucide-react";
import { addMedicine, mergeMedicine, setMedicineActive, updateMedicine } from "@/app/actions/medicines";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Banner, EmptyState } from "@/components/ui/Feedback";
import { Field, FieldError, TextInput, inputStyles } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/utils";
import type { ActionResult, Medicine } from "@/lib/types";

type Filter = "active" | "inactive" | "all";

type Actions = {
  add: typeof addMedicine;
  update: typeof updateMedicine;
  setActive: typeof setMedicineActive;
  merge: typeof mergeMedicine;
};

const REAL: Actions = { add: addMedicine, update: updateMedicine, setActive: setMedicineActive, merge: mergeMedicine };

/**
 * The doctor's master medicine list (Settings → Master medicines). Add, edit, deactivate, merge.
 * No delete, on purpose: a deactivated medicine just stops being suggested; a merged one points at the kept one.
 * `actions` is only overridden by /styleguide.
 */
export function MedicineList({ medicines, actions = REAL }: { medicines: Medicine[]; actions?: Actions }) {
  const [filter, setFilter] = useState<Filter>("active");
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [merging, setMerging] = useState<Medicine | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(medicines.map((m) => [m.id, m])), [medicines]);
  const counts = {
    active: medicines.filter((m) => m.active).length,
    inactive: medicines.filter((m) => !m.active).length,
  };
  const visible = medicines.filter((m) => {
    const q = query.trim().toLowerCase();
    const inFilter = filter === "all" || (filter === "active" ? m.active : !m.active);
    return inFilter && (!q || m.name.toLowerCase().includes(q));
  });

  async function run(result: Promise<ActionResult<unknown>>, success: string) {
    const r = await result;
    setNotice(r.ok ? { tone: "success", text: success } : { tone: "danger", text: r.error });
    return r.ok;
  }

  async function add() {
    setAdding(true);
    const ok = await run(actions.add({ name, defaultDose: dose }), `${name.trim()} added to your medicines.`);
    setAdding(false);
    if (ok) {
      setName("");
      setDose("");
    }
  }

  async function toggle(m: Medicine) {
    setBusyId(m.id);
    await run(actions.setActive(m.id, !m.active), m.active ? `${m.name} won't be suggested any more.` : `${m.name} is active again.`);
    setBusyId(null);
  }

  return (
    <Card tone="subtle" className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[22px] font-semibold tracking-tight">Master medicines</h1>
        <p className="text-[15px] text-ink-2">
          Your list of medicines. They&apos;re suggested when you write a prescription. Nothing is ever deleted: deactivate one to stop
          suggesting it, or merge duplicates.
        </p>
      </div>

      <Card tone="solid" radius="tile" as="form" className="grid gap-3 p-4 sm:grid-cols-[1fr_200px_auto] sm:items-end" onSubmit={(e: React.FormEvent) => { e.preventDefault(); void add(); }}>
        <Field id="new-medicine" label="Medicine and strength">
          <TextInput id="new-medicine" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Paracetamol 650 mg" autoComplete="off" />
        </Field>
        <Field id="new-dose" label="Usual dose" optional>
          <TextInput id="new-dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="1 tablet" autoComplete="off" />
        </Field>
        <Button type="submit" loading={adding} disabled={name.trim().length < 2}>
          <Plus aria-hidden="true" className="size-[18px]" />
          Add medicine
        </Button>
      </Card>

      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}

      <div className="flex flex-wrap items-center gap-3">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your medicines" aria-label="Search medicines" className="h-11 min-w-0 flex-1 sm:max-w-xs" />
        <Segmented
          label="Show"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "active", label: `Active · ${counts.active}` },
            { value: "inactive", label: `Inactive · ${counts.inactive}` },
            { value: "all", label: "All" },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={Pill} title={medicines.length === 0 ? "No medicines yet" : "Nothing matches"}>
          {medicines.length === 0 ? "Add the medicines you prescribe most. They'll be suggested in every prescription." : "Try another name or show all."}
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((m) => {
            const into = m.merged_into ? byId.get(m.merged_into) : null;
            return (
              <li key={m.id}>
                <Card tone="solid" radius="tile" className={cn("flex flex-wrap items-center gap-3 p-3.5 sm:flex-nowrap", !m.active && "bg-white/70")}>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className={cn("font-semibold", !m.active && "text-ink-2")}>{m.name}</span>
                    <span className="text-[13px] text-ink-2">
                      {m.default_dose ? `Usual dose: ${m.default_dose}` : "No usual dose"}
                    </span>
                  </div>
                  {into ? (
                    <Badge tone="outline" icon={<Merge aria-hidden="true" />}>Merged into {into.name}</Badge>
                  ) : !m.active ? (
                    <Badge tone="neutral" icon={<PowerOff aria-hidden="true" />}>Inactive</Badge>
                  ) : null}
                  {into ? null : (
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(m)}>
                        <Pencil aria-hidden="true" className="size-4" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(m)} loading={busyId === m.id}>
                        {m.active ? <PowerOff aria-hidden="true" className="size-4" /> : <Power aria-hidden="true" className="size-4" />}
                        {m.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setMerging(m)}>
                        <Merge aria-hidden="true" className="size-4" /> Merge
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {editing ? <EditDialog medicine={editing} onClose={() => setEditing(null)} onSave={(n, d) => run(actions.update(editing.id, { name: n, defaultDose: d }), "Saved.")} /> : null}
      {merging ? (
        <MergeDialog
          duplicate={merging}
          candidates={medicines.filter((m) => m.id !== merging.id && !m.merged_into)}
          onClose={() => setMerging(null)}
          onMerge={(keep) => run(actions.merge(merging.id, keep.id), `${merging.name} merged into ${keep.name}.`)}
        />
      ) : null}
    </Card>
  );
}

function EditDialog({ medicine, onClose, onSave }: { medicine: Medicine; onClose: () => void; onSave: (name: string, dose: string) => Promise<boolean> }) {
  const [name, setName] = useState(medicine.name);
  const [dose, setDose] = useState(medicine.default_dose ?? "");
  const [saving, setSaving] = useState(false);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit medicine"
      description="Changes apply to new prescriptions. Prescriptions already issued keep the name they were written with."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            loading={saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onSave(name, dose);
              setSaving(false);
              if (ok) onClose();
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field id="edit-medicine" label="Medicine and strength">
          <TextInput id="edit-medicine" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="edit-dose" label="Usual dose" optional>
          <TextInput id="edit-dose" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="1 tablet" />
        </Field>
      </div>
    </Dialog>
  );
}

function MergeDialog({
  duplicate,
  candidates,
  onClose,
  onMerge,
}: {
  duplicate: Medicine;
  candidates: Medicine[];
  onClose: () => void;
  onMerge: (keep: Medicine) => Promise<boolean>;
}) {
  const [keepId, setKeepId] = useState("");
  const [saving, setSaving] = useState(false);
  const keep = candidates.find((c) => c.id === keepId);
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Merge ${duplicate.name}`}
      description="Pick the one to keep. This one becomes inactive and points to it, so it's never lost. Use this for duplicates and spelling variants."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            disabled={!keep}
            loading={saving}
            onClick={async () => {
              if (!keep) return;
              setSaving(true);
              const ok = await onMerge(keep);
              setSaving(false);
              if (ok) onClose();
            }}
          >
            Merge
          </Button>
        </>
      }
    >
      <Field id="merge-into" label="Keep this medicine">
        <select
          id="merge-into"
          value={keepId}
          onChange={(e) => setKeepId(e.target.value)}
          className={cn(inputStyles, "h-12")}
        >
          <option value="">Choose a medicine</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.active ? "" : " (inactive)"}
            </option>
          ))}
        </select>
      </Field>
      {candidates.length === 0 ? <FieldError>There&apos;s nothing else to merge into yet.</FieldError> : null}
    </Dialog>
  );
}
