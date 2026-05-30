"use client";

import { useMemo, useState } from "react";
import { ProfileFormField, ProfileFormInput, ProfileFormModal } from "@/components/user-profile/ProfileFormModal";
import { btnGhost, btnPrimaryBrand } from "@/constants/ui/button-classes";
import { useProfileData, useUpdateProfileMutation } from "@/features/user-profile/hooks/use-profile-data";
import { Plus, X } from "lucide-react";

export function ProfileSkillsSection() {
  const { data: profile, isLoading } = useProfileData();
  const updateProfile = useUpdateProfileMutation();
  const skills = useMemo(() => profile?.skills ?? [], [profile?.skills]);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");

  const openModal = () => {
    setSelected([...skills]);
    setModalOpen(true);
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    setSelected(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setNewSkill("");
  };

  const save = async () => {
    await updateProfile.mutateAsync({ skills: selected });
    setModalOpen(false);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Skills</h3>
        <button type="button" onClick={openModal} className={`${btnGhost} !text-brand-600`}>
          <Plus size={14} /> {skills.length ? "Edit skills" : "Add skills"}
        </button>
      </div>

      {isLoading ? (
        <div className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : skills.length === 0 ? (
        <p className="text-sm text-slate-500">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <span
              key={skill}
              className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-800 dark:bg-brand-950/40 dark:text-brand-200"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <ProfileFormModal
        open={modalOpen}
        title="Edit skills"
        onClose={() => setModalOpen(false)}
        onSubmit={() => void save()}
        submitDisabled={updateProfile.isPending}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selected.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
              >
                {skill}
                <button type="button" onClick={() => setSelected(prev => prev.filter(s => s !== skill))} aria-label={`Remove ${skill}`}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <ProfileFormField label="Add a skill">
            <div className="flex gap-2">
              <ProfileFormInput
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. Python"
              />
              <button type="button" className={btnPrimaryBrand} onClick={addSkill}>
                Add
              </button>
            </div>
          </ProfileFormField>
        </div>
      </ProfileFormModal>
    </section>
  );
}
