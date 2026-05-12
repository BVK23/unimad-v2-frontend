"use client";

import React, { useState } from "react";
import { useOnboardingStore } from "@/features/onboarding/store/useOnboardingStore";
import { useOnboardingUIStore } from "@/features/onboarding/store/useOnboardingUIStore";
import type { OnboardingEducation } from "@/features/onboarding/types";
import { saveOnboardingData } from "@/lib/actions/onboardingActions";
import { Check, Pencil, Plus, X } from "lucide-react";
import FormShell from "./shared/FormShell";
import Heading from "./shared/Heading";
import MonthYearInput, { formatMonthYear } from "./shared/MonthYearInput";
import PrimaryButton from "./shared/PrimaryButton";
import TextField from "./shared/TextField";
import { useShowToast } from "./shared/Toast";

type EducationFormProps = {
  onComplete: () => void;
};

const EMPTY_EDUCATION: OnboardingEducation = {
  institution: "",
  course: "",
  startDate: "",
  endDate: "",
  courseWork: "",
};

const validate = (values: OnboardingEducation): Partial<Record<keyof OnboardingEducation, string>> => {
  const errors: Partial<Record<keyof OnboardingEducation, string>> = {};
  if (!values.institution.trim()) errors.institution = "University name is required";
  if (!values.course.trim()) errors.course = "Course name is required";
  if (!values.startDate) errors.startDate = "Start date is required";
  if (!values.endDate) errors.endDate = "End date is required";
  if (!values.courseWork.trim()) errors.courseWork = "Coursework is required";

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

export default function EducationForm({ onComplete }: EducationFormProps) {
  const setLoading = useOnboardingUIStore(s => s.setLoadingMessage);
  const userOnboardingData = useOnboardingStore(s => s.userOnboardingData);
  const setUserOnboardingData = useOnboardingStore(s => s.setUserOnboardingData);
  const toast = useShowToast();

  const [items, setItems] = useState<OnboardingEducation[]>(userOnboardingData.educations ?? []);
  const [showInputs, setShowInputs] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<OnboardingEducation>(EMPTY_EDUCATION);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingEducation, string>>>({});

  const isEditing = editingIndex !== null;

  const handleEditClick = (idx: number) => {
    setEditingIndex(idx);
    setShowInputs(true);
    setDraft(items[idx]);
  };

  const handleCancel = () => {
    setShowInputs(false);
    setEditingIndex(null);
    setDraft(EMPTY_EDUCATION);
    setErrors({});
  };

  const commitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(draft);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    if (isEditing && editingIndex !== null) {
      setItems(prev => prev.map((it, i) => (i === editingIndex ? draft : it)));
    } else {
      setItems(prev => [...prev, draft]);
    }
    handleCancel();
  };

  const removeAt = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleNext = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one education");
      return;
    }
    try {
      setLoading(true);
      await saveOnboardingData("educations", { educations: items });
      setUserOnboardingData({ educations: items });
      onComplete();
    } catch (err) {
      console.error("Error saving education", err);
      toast.error("Failed to save education");
    } finally {
      setLoading(null);
    }
  };

  return (
    <FormShell as="form" onSubmit={commitDraft} width="wide">
      <Heading>Add your education</Heading>

      {items.length > 0 ? (
        <div className="w-full space-y-2.5">
          {items.map((edu, idx) => {
            if (idx === editingIndex) return null;
            return (
              <div
                key={idx}
                className="w-full px-5 py-4 rounded-[12px] bg-white border border-[rgba(12,15,26,0.07)] flex flex-col lg:flex-row gap-3 lg:items-center text-sm text-[#0C0F1A]"
              >
                <span className="flex items-center gap-2 lg:max-w-[260px] lg:min-w-[200px]">
                  <Check size={16} className="text-emerald-500 flex-shrink-0" />
                  <span className="line-clamp-2 text-left">
                    {edu.institution}, {edu.course}
                  </span>
                </span>
                <div className="flex-1 text-left text-[#4A5568]">
                  <div className="flex flex-wrap gap-1.5">
                    {edu.courseWork
                      .split(",")
                      .map(c => c.trim())
                      .filter(Boolean)
                      .map((c, i) => (
                        <span key={i} className="inline-flex bg-[#F0F3F8] text-[#4A5568] rounded-md px-2 py-0.5 text-xs">
                          {c}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#4A5568]">
                  <span>
                    {formatMonthYear(edu.startDate)} – {formatMonthYear(edu.endDate)}
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
            placeholder="University Name"
            value={draft.institution}
            invalid={Boolean(errors.institution)}
            helperText={errors.institution}
            onChange={e => setDraft(d => ({ ...d, institution: e.target.value }))}
          />
          <TextField
            placeholder="Course Name"
            value={draft.course}
            invalid={Boolean(errors.course)}
            helperText={errors.course}
            onChange={e => setDraft(d => ({ ...d, course: e.target.value }))}
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
              presentLabel="Currently Studying"
              invalid={Boolean(errors.endDate)}
            />
            {errors.endDate ? <span className="text-xs text-rose-600">{errors.endDate}</span> : null}
          </div>
          <div className="md:col-span-2">
            <TextField
              multiline
              rows={5}
              placeholder="Coursework (separate items with commas)"
              value={draft.courseWork}
              invalid={Boolean(errors.courseWork)}
              helperText={errors.courseWork}
              onChange={e => setDraft(d => ({ ...d, courseWork: e.target.value }))}
            />
          </div>
        </div>
      ) : null}

      {!showInputs ? (
        <button
          type="button"
          onClick={() => {
            setDraft(EMPTY_EDUCATION);
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
            Next
          </PrimaryButton>
        ) : null}
      </div>
    </FormShell>
  );
}
