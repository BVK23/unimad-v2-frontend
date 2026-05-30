"use client";

import { useMemo, useState } from "react";
import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";
import { ProfileFormField, ProfileFormInput, ProfileFormModal, ProfileFormTextarea } from "@/components/user-profile/ProfileFormModal";
import { btnGhost } from "@/constants/ui/button-classes";
import { useProfileData, useUpdateProfileMutation } from "@/features/user-profile/hooks/use-profile-data";
import type { ProfileEducation } from "@/features/user-profile/types";
import { formatDateRange } from "@/features/user-profile/utils/profile-format";
import { Pencil, Plus, Trash2 } from "lucide-react";

const empty: ProfileEducation = {
  institution: "",
  course: "",
  startDate: "",
  endDate: "",
  courseWork: "",
  location: "",
};

function toMonthValue(dateStr: string): string {
  if (!dateStr || dateStr === "Present") return "";
  const parsed = dateStr.match(/^(\d{4})-(\d{1,2})/);
  if (parsed) return `${parsed[1]}-${parsed[2].padStart(2, "0")}`;
  return dateStr;
}

export function ProfileEducationSection() {
  const { data: profile, isLoading } = useProfileData();
  const updateProfile = useUpdateProfileMutation();
  const items = useMemo(() => (profile?.educations ?? []) as ProfileEducation[], [profile?.educations]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<ProfileEducation>(empty);
  const [isPresent, setIsPresent] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const openAdd = () => {
    setEditIndex(null);
    setForm(empty);
    setIsPresent(false);
    setModalOpen(true);
  };

  const openEdit = (index: number) => {
    const item = items[index];
    if (!item) return;
    setEditIndex(index);
    setForm({ ...item, startDate: toMonthValue(item.startDate), endDate: toMonthValue(item.endDate) });
    setIsPresent(item.endDate === "Present");
    setModalOpen(true);
  };

  const save = async () => {
    const payload: ProfileEducation = {
      ...form,
      endDate: isPresent ? "Present" : form.endDate,
    };
    const next = editIndex === null ? [...items, payload] : items.map((item, i) => (i === editIndex ? payload : item));
    await updateProfile.mutateAsync({ educations: next });
    setModalOpen(false);
  };

  const remove = async (index: number) => {
    await updateProfile.mutateAsync({ educations: items.filter((_, i) => i !== index) });
    setDeleteIndex(null);
  };

  const canSave = Boolean(form.institution.trim() && form.course.trim() && form.startDate && (isPresent || form.endDate));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Education</h3>
        <button type="button" onClick={openAdd} className={`${btnGhost} !text-brand-600`}>
          <Plus size={14} /> Add education
        </button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No education added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((edu, index) => (
            <div key={`${edu.institution}-${index}`} className="group space-y-1">
              <button
                type="button"
                onClick={() => openEdit(index)}
                className="w-full rounded-xl border border-brand-500/25 bg-white px-4 py-3 text-left transition hover:bg-brand-50/50 dark:border-brand-500/20 dark:bg-[#111] dark:hover:bg-brand-950/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{edu.institution}</span>
                  <span className="text-xs text-slate-500">{formatDateRange(edu.startDate, edu.endDate)}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-medium text-brand-600 dark:text-brand-400">{edu.course}</span>
                  {edu.location ? <span className="italic text-slate-500">{edu.location}</span> : null}
                </div>
                {edu.courseWork ? <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3">{edu.courseWork}</p> : null}
              </button>
              <div className="flex justify-end gap-3 px-1 opacity-0 transition group-hover:opacity-100">
                <button type="button" onClick={() => openEdit(index)} className="text-xs text-brand-600 inline-flex items-center gap-1">
                  <Pencil size={12} /> Edit
                </button>
                <button type="button" onClick={() => setDeleteIndex(index)} className="text-xs text-red-600 inline-flex items-center gap-1">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProfileFormModal
        open={modalOpen}
        title={editIndex === null ? "Add education" : "Edit education"}
        onClose={() => setModalOpen(false)}
        onSubmit={() => void save()}
        submitLabel={editIndex === null ? "Add" : "Save"}
        submitDisabled={!canSave || updateProfile.isPending}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileFormField label="University / institution">
            <ProfileFormInput value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
          </ProfileFormField>
          <ProfileFormField label="Course">
            <ProfileFormInput value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} />
          </ProfileFormField>
          <ProfileFormField label="Location">
            <ProfileFormInput value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </ProfileFormField>
          <ProfileFormField label="Start date">
            <ProfileFormInput type="month" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
          </ProfileFormField>
          <ProfileFormField label="End date">
            <ProfileFormInput
              type="month"
              value={isPresent ? "" : form.endDate}
              disabled={isPresent}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <input type="checkbox" checked={isPresent} onChange={e => setIsPresent(e.target.checked)} />
              Currently studying
            </label>
          </ProfileFormField>
          <ProfileFormField label="Coursework" className="sm:col-span-2">
            <ProfileFormTextarea value={form.courseWork} onChange={e => setForm(f => ({ ...f, courseWork: e.target.value }))} />
          </ProfileFormField>
        </div>
      </ProfileFormModal>

      <ProfileConfirmDialog
        open={deleteIndex !== null}
        title="Delete education?"
        description="This will remove this entry from your resume profile data."
        confirmLabel="Delete"
        onCancel={() => setDeleteIndex(null)}
        onConfirm={() => deleteIndex !== null && void remove(deleteIndex)}
        confirmDisabled={updateProfile.isPending}
      />
    </section>
  );
}
