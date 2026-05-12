"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import type { OnboardingProject } from "@/features/onboarding/types";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import { Check, Link2, Pencil, Plus, X } from "lucide-react";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import PrimaryButton from "./shared/PrimaryButton";
import TextField from "./shared/TextField";
import { useShowToast } from "./shared/Toast";

type DraftProject = {
  name: string;
  link: string;
  descriptions: string;
};

type ProjectsFormProps = {
  /** When true, the user must add at least one project (e.g. they skipped experiences). */
  isRequired: boolean;
  onComplete: () => void;
};

const EMPTY_DRAFT: DraftProject = { name: "", link: "", descriptions: "" };

const isValidUrl = (raw: string) => {
  if (!raw) return true;
  try {
    new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return true;
  } catch {
    return false;
  }
};

const validate = (values: DraftProject): Partial<Record<keyof DraftProject, string>> => {
  const errors: Partial<Record<keyof DraftProject, string>> = {};
  if (!values.name.trim()) errors.name = "Project name is required";
  if (!values.descriptions.trim()) errors.descriptions = "Description is required";
  if (values.link && !isValidUrl(values.link)) errors.link = "Must be a valid URL";
  return errors;
};

const draftToValue = (draft: DraftProject): OnboardingProject => {
  const lines = draft.descriptions
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.startsWith("-"))
    .map(line => line.substring(1).trim())
    .filter(Boolean);

  const descriptions = lines.length === 0 && draft.descriptions.trim() !== "" ? [draft.descriptions.trim()] : lines;

  const link = draft.link && !draft.link.startsWith("http") ? `https://${draft.link}` : draft.link;

  return {
    name: draft.name,
    link: link || undefined,
    descriptions,
  };
};

const valueToDraft = (item: OnboardingProject): DraftProject => ({
  name: item.name,
  link: item.link ?? "",
  descriptions: item.descriptions.map(d => `- ${d}`).join("\n"),
});

const truncate = (text: string, length = 95) => (text.length > length ? `${text.slice(0, length)}…` : text);

export default function ProjectsForm({ isRequired, onComplete }: ProjectsFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [items, setItems] = useState<OnboardingProject[]>(userOnboardingData.projects ?? []);
  const [showInputs, setShowInputs] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftProject>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<Partial<Record<keyof DraftProject, string>>>({});

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
    if (items.length === 0 && isRequired) {
      toast.error("Please add at least one project");
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("projects", { projects: items });
      setUserOnboardingData({ projects: items });
      onComplete();
    } catch (err) {
      console.error("Error saving projects", err);
      toast.error("Failed to save projects");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell as="form" onSubmit={commitDraft} width="wide">
      <Heading>Add your projects, if any?</Heading>

      {items.length > 0 ? (
        <div className="w-full space-y-2.5">
          {items.map((item, idx) => {
            if (idx === editingIndex) return null;
            return (
              <div
                key={idx}
                className="w-full px-5 py-4 rounded-[12px] bg-white border border-[rgba(12,15,26,0.07)] flex flex-col lg:flex-row gap-3 lg:items-center text-sm text-[#0C0F1A]"
              >
                <span className="flex items-center gap-2 lg:max-w-[200px] lg:min-w-[140px]">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="line-clamp-2 text-left">{item.name}</span>
                </span>
                <span className="grow text-left text-[#4A5568] line-clamp-2">{truncate(item.descriptions.join(", "), 100)}</span>
                <div className="flex items-center gap-3 text-xs text-[#4A5568]">
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[#346DE0]" aria-label="Open project link">
                      <Link2 size={14} />
                    </a>
                  ) : null}
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
            placeholder="Project name"
            value={draft.name}
            invalid={Boolean(errors.name)}
            helperText={errors.name}
            onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
          />
          <TextField
            placeholder="Link"
            type="url"
            value={draft.link}
            invalid={Boolean(errors.link)}
            helperText={errors.link}
            onChange={e => setDraft(d => ({ ...d, link: e.target.value }))}
          />
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
        {!showInputs ? (
          <PrimaryButton type="button" onClick={handleNext} className="mt-3">
            {items.length === 0 && !isRequired ? "Skip" : "Next"}
          </PrimaryButton>
        ) : null}
      </div>
    </FormShell>
  );
}
