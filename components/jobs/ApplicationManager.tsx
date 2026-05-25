"use client";

import React from "react";
import { updateApplication } from "@/features/application-tracker/server-actions/application-actions";
import type { Application, ApplicationStatus, CreateApplicationInput, UpdateApplicationInput } from "@/features/application-tracker/types";
import AddApplicationModal from "./AddApplicationModal";
import ApplicationDetailsModal from "./ApplicationDetailsModal";

interface ApplicationManagerProps {
  isOpen: boolean;
  handleClose: () => void;
  tabState: "" | "toAdd" | "toView" | "toEdit";
  setTabState: (s: "" | "toAdd" | "toView" | "toEdit") => void;
  selectedApplication: Application | null;
  setSelectedApplication: (a: Application | null) => void;
  onAdd: (data: CreateApplicationInput) => void;
  handleCardUpdate: () => void;
  initialStatusForAdd?: ApplicationStatus;
  onPrepare: (application: Application) => void;
  onStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>;
}

const ApplicationManager: React.FC<ApplicationManagerProps> = ({
  isOpen,
  handleClose,
  tabState,
  setTabState,
  selectedApplication,
  onAdd,
  handleCardUpdate,
  initialStatusForAdd = "draft",
  onPrepare,
  onStatusChange,
}) => {
  const handleUpdate = async (applicationId: string, data: UpdateApplicationInput) => {
    await updateApplication(applicationId, data);
    handleCardUpdate();
  };

  if (tabState === "toAdd") {
    return (
      <AddApplicationModal isOpen={isOpen} onClose={handleClose} onAdd={onAdd} initialStatus={initialStatusForAdd as ApplicationStatus} />
    );
  }

  if (tabState === "toView" || tabState === "toEdit") {
    return (
      <ApplicationDetailsModal
        isOpen={isOpen}
        onClose={handleClose}
        mode={tabState === "toEdit" ? "edit" : "view"}
        setMode={m => setTabState(m === "edit" ? "toEdit" : "toView")}
        application={selectedApplication}
        onUpdate={handleUpdate}
        onStatusChange={onStatusChange}
        onPrepare={onPrepare}
      />
    );
  }

  return null;
};

export default ApplicationManager;
