"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import type { OnboardingExperience } from "@/features/onboarding/types";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import { Check, Pencil, Plus, X } from "lucide-react";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import MonthYearInput, { formatMonthYear } from "./shared/MonthYearInput";
import PrimaryButton from "./shared/PrimaryButton";
import TextField from "./shared/TextField";
import { useShowToast } from "./shared/Toast";

type DraftExperience = Omit<OnboardingExperience, "descriptions"> & { descriptions: string };

type ExperienceFormProps = {
  /** Called when the user finishes this step. `skipped=true` indicates no experiences were added. */
  onComplete: (skipped: boolean) => void;
};

const EMPTY_DRAFT: DraftExperience = {
  organisation: "",
  role: "",
  startDate: "",
  endDate: "",
  descriptions: "",
};

const validate = (values: DraftExperience): Partial<Record<keyof DraftExperience, string>> => {
  const errors: Partial<Record<keyof DraftExperience, string>> = {};
  if (!values.organisation.trim()) errors.organisation = "Company name is required";
  if (!values.role.trim()) errors.role = "Role name is required";
  if (!values.startDate) errors.startDate = "Start date is required";
  if (!values.endDate) errors.endDate = "End date is required";
  if (!values.descriptions.trim()) errors.descriptions = "Description is required";

  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate);
    if (values.endDate === "Present") {
      if (start.getTime() > Date.now()) errors.startDate = "Start date cannot be in the future";
    } else {
      const end = new Date(values.endDate);
      if (start > end) errors.startDate = "Start date must be before end date";
    }
  }
  return errors;
};

const draftToValue = (draft: DraftExperience): OnboardingExperience => {
  const lines = draft.descriptions
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith("-"))
    .map(line => line.substring(1).trim())
    .filter(Boolean);

  const descriptions = lines.length === 0 && draft.descriptions.trim() !== "" ? [draft.descriptions.trim()] : lines;

  return {
    organisation: draft.organisation,
    role: draft.role,
    startDate: draft.startDate,
    endDate: draft.endDate,
    descriptions,
  };
};

const valueToDraft = (item: OnboardingExperience): DraftExperience => ({
  organisation: item.organisation,
  role: item.role,
  startDate: item.startDate,
  endDate: item.endDate,
  descriptions: item.descriptions.map(d => `- ${d}`).join("\n"),
});

const truncate = (text: string, length = 95) => (text.length > length ? `${text.slice(0, length)}…` : text);

export default function ExperienceForm({ onComplete }: ExperienceFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [items, setItems] = useState<OnboardingExperience[]>(userOnboardingData.experiences ?? []);
  const [showInputs, setShowInputs] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftExperience>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<keyof DraftExperience, string>>>({});

  const isEditing = editingIndex !== null;

  const handleEditClick = (idx: number) => {
    setEditingIndex(idx);
    setShowInputs(true);
    setDraft(valueToDraft(items[idx]));
  };

  const handleCancel = () => {
    setShowInputs(false);
    setEditingIndex(null);
    setDraft(EMPTY_DRAFT);
    setErrors({});
  };

  const commitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(draft);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const value = draftToValue(draft);
    if (isEditing && editingIndex !== null) {
      setItems(prev => prev.map((it, i) => (i === editingIndex ? value : it)));
    } else {
      setItems(prev => [...prev, value]);
    }
    handleCancel();
  };

  const removeAt = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleDescriptionsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const target = e.currentTarget;
    const cursor = target.selectionStart ?? target.value.length;
    const before = target.value.substring(0, cursor);
    const after = target.value.substring(cursor);
    const prefix = before.endsWith("\n") || before === "" ? "- " : "\n- ";
    const next = before + prefix + after;
    setDraft(d => ({ ...d, descriptions: next }));
    requestAnimationFrame(() => {
      target.selectionStart = cursor + prefix.length;
      target.selectionEnd = cursor + prefix.length;
    });
  };

  const handleNext = async () => {
    if (items.length === 0) {
      onComplete(true);
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("experiences", { experiences: items });
      setUserOnboardingData({ experiences: items });
      onComplete(false);
    } catch (err) {
      console.error("Error saving experience", err);
      toast.error("Failed to save experience");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell as="form" onSubmit={commitDraft} width="wide">
      <Heading>Add your work experience</Heading>

      {items.length > 0 ? (
        <div className="w-full space-y-2.5">
          {items.map((item, idx) => {
            if (idx === editingIndex) return null;
            return (
              <div
                key={idx}
                className="w-full px-5 py-4 rounded-[12px] bg-white border border-[rgba(12,15,26,0.07)] flex flex-col lg:flex-row gap-3 lg:items-center text-sm text-[#0C0F1A]"
              >
                <span className="flex items-center gap-2 lg:max-w-[260px] lg:min-w-[180px]">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="line-clamp-2 text-left">
                    {item.organisation}, {item.role}
                  </span>
                </span>
                <span className="grow text-left text-[#4A5568] line-clamp-2">{truncate(item.descriptions.join(", "), 100)}</span>
                <div className="flex items-center gap-3 text-xs text-[#4A5568]">
                  <span>
                    {formatMonthYear(item.startDate)} – {formatMonthYear(item.endDate)}
                  </span>
                  <button
                    type="button"
                    aria-label="Edit"
                    disabled={showInputs}
                    onClick={() => !showInputs && handleEditClick(idx)}
                    className="text-[#4A5568] hover:text-[#346DE0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    disabled={showInputs}
                    onClick={() => !showInputs && removeAt(idx)}
                    className="text-[#4A5568] hover:text-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showInputs ? (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <TextField
            placeholder="Company Name"
            value={draft.organisation}
            invalid={Boolean(errors.organisation)}
            helperText={errors.organisation}
            onChange={e => setDraft(d => ({ ...d, organisation: e.target.value }))}
          />
          <TextField
            placeholder="Role"
            value={draft.role}
            invalid={Boolean(errors.role)}
            helperText={errors.role}
            onChange={e => setDraft(d => ({ ...d, role: e.target.value }))}
          />
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[#4A5568]">Start Date</span>
            <MonthYearInput
              value={draft.startDate}
              onChange={v => setDraft(d => ({ ...d, startDate: v }))}
              placeholder="Start Date"
              invalid={Boolean(errors.startDate)}
            />
            {errors.startDate ? <span className="text-xs text-rose-600">{errors.startDate}</span> : null}
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[#4A5568]">End Date</span>
            <MonthYearInput
              value={draft.endDate}
              onChange={v => setDraft(d => ({ ...d, endDate: v }))}
              placeholder="End Date"
              showPresentOption
              presentLabel="I currently work here"
              invalid={Boolean(errors.endDate)}
            />
            {errors.endDate ? <span className="text-xs text-rose-600">{errors.endDate}</span> : null}
          </div>
          <div className="md:col-span-2">
            <TextField
              multiline
              rows={6}
              placeholder="Description"
              value={draft.descriptions}
              onKeyDown={handleDescriptionsKeyDown}
              invalid={Boolean(errors.descriptions)}
              helperText={errors.descriptions ?? "Use '-' to denote a new bullet point."}
              onChange={e => setDraft(d => ({ ...d, descriptions: e.target.value }))}
            />
          </div>
        </div>
      ) : null}

      {!showInputs ? (
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY_DRAFT);
            setEditingIndex(null);
            setErrors({});
            setShowInputs(true);
          }}
          className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#346DE0] bg-transparent py-3 text-sm font-medium text-[#346DE0] hover:bg-[#F0F6FE]"
        >
          <Plus size={16} /> Add more
        </button>
      ) : null}

      <div className="flex items-center gap-3">
        {showInputs ? (
          <PrimaryButton variant="secondary" type="button" onClick={handleCancel}>
            Cancel
          </PrimaryButton>
        ) : null}
        {showInputs ? <PrimaryButton type="submit">{isEditing ? "Save" : "Add"}</PrimaryButton> : null}
        {!showInputs && items.length > 0 ? (
          <PrimaryButton type="button" onClick={handleNext} className="mt-3">
            Next
          </PrimaryButton>
        ) : null}
      </div>
    </FormShell>
  );
}
