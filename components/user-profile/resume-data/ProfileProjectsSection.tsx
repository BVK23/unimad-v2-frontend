"use client";

import { useMemo, useState } from "react";
import { ProfileConfirmDialog } from "@/components/user-profile/ProfileConfirmDialog";
import { ProfileFormField, ProfileFormInput, ProfileFormModal, ProfileFormTextarea } from "@/components/user-profile/ProfileFormModal";
import { btnGhost } from "@/constants/ui/button-classes";
import { useProfileData, useUpdateProfileMutation } from "@/features/user-profile/hooks/use-profile-data";
import type { ProfileProject } from "@/features/user-profile/types";
import { descriptionsArrayToString, descriptionsStringToArray } from "@/features/user-profile/utils/profile-format";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

type ProjectForm = Omit<ProfileProject, "descriptions"> & { descriptions: string };

const empty: ProjectForm = { title: "", descriptions: "", url: "" };

export function ProfileProjectsSection() {
  const { data: profile, isLoading } = useProfileData();
  const updateProfile = useUpdateProfileMutation();
  const items = useMemo(() => (profile?.projects ?? []) as ProfileProject[], [profile?.projects]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<ProjectForm>(empty);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const openAdd = () => {
    setEditIndex(null);
    setForm(empty);
    setModalOpen(true);
  };

  const openEdit = (index: number) => {
    const item = items[index];
    if (!item) return;
    setEditIndex(index);
    setForm({
      title: item.title,
      url: item.url ?? "",
      descriptions: descriptionsArrayToString(item.descriptions),
    });
    setModalOpen(true);
  };

  const save = async () => {
    const payload: ProfileProject = {
      title: form.title,
      url: form.url?.trim() || undefined,
      descriptions: descriptionsStringToArray(form.descriptions),
    };
    const next = editIndex === null ? [...items, payload] : items.map((item, i) => (i === editIndex ? payload : item));
    await updateProfile.mutateAsync({ projects: next });
    setModalOpen(false);
  };

  const remove = async (index: number) => {
    await updateProfile.mutateAsync({ projects: items.filter((_, i) => i !== index) });
    setDeleteIndex(null);
  };

  const canSave = Boolean(form.title.trim() && form.descriptions.trim());

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Projects</h3>
        <button type="button" onClick={openAdd} className={`${btnGhost} !text-brand-600`}>
          <Plus size={14} /> Add project
        </button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No projects added yet.</p>
      ) : (
        <div className="space-y-3">
          {items.map((project, index) => (
            <div key={`${project.title}-${index}`} className="group space-y-1">
              <button
                type="button"
                onClick={() => openEdit(index)}
                className="w-full rounded-xl border border-brand-500/25 bg-white px-4 py-3 text-left transition hover:bg-brand-50/50 dark:border-brand-500/20 dark:bg-[#111] dark:hover:bg-brand-950/20"
              >
                <div className="text-sm font-semibold text-slate-900 dark:text-white">{project.title}</div>
                {project.descriptions?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600 dark:text-slate-400">
                    {project.descriptions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                ) : null}
                {project.url ? (
                  <span className="mt-2 inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400">
                    <ExternalLink size={12} /> Project link
                  </span>
                ) : null}
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
        title={editIndex === null ? "Add project" : "Edit project"}
        onClose={() => setModalOpen(false)}
        onSubmit={() => void save()}
        submitLabel={editIndex === null ? "Add" : "Save"}
        submitDisabled={!canSave || updateProfile.isPending}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileFormField label="Project title">
            <ProfileFormInput value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </ProfileFormField>
          <ProfileFormField label="URL (optional)">
            <ProfileFormInput type="url" value={form.url ?? ""} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </ProfileFormField>
          <ProfileFormField label="Description" className="sm:col-span-2">
            <ProfileFormTextarea
              value={form.descriptions}
              onChange={e => setForm(f => ({ ...f, descriptions: e.target.value }))}
              placeholder="Use '-' at the start of each bullet line"
            />
          </ProfileFormField>
        </div>
      </ProfileFormModal>

      <ProfileConfirmDialog
        open={deleteIndex !== null}
        title="Delete project?"
        description="This will remove this entry from your resume profile data."
        confirmLabel="Delete"
        onCancel={() => setDeleteIndex(null)}
        onConfirm={() => deleteIndex !== null && void remove(deleteIndex)}
        confirmDisabled={updateProfile.isPending}
      />
    </section>
  );
}
