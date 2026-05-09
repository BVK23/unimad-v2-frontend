"use client";

import React, { useMemo, useState } from "react";
import { useApplications } from "@/features/application-tracker/hooks/useApplications";
import { createApplication, updateApplication } from "@/features/application-tracker/server-actions/application-actions";
import type { Application, ApplicationStatus, CreateApplicationInput } from "@/features/application-tracker/types";
import type { GeneratorContext, Job } from "@/types/jobs";
import { useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { Plus } from "lucide-react";
import AddApplicationModal from "./AddApplicationModal";
import ApplicationManager from "./ApplicationManager";
import JobCard from "./JobCard";
import PrepareApplicationModal from "./PrepareApplicationModal";

/** Map backend Application to Job for the original JobCard UI */
function applicationToJob(app: Application): Job {
  const statusMap: ApplicationStatus | "offer" = app.status === "offered" ? "offer" : app.status;
  return {
    id: app.application_id,
    role: app.role,
    company: app.company,
    logo: "",
    location: app.location ?? "—",
    postedDate: app.applied_date ?? "—",
    matchScore: 95,
    description: app.job_description ?? "",
    applicationStatus: statusMap as Job["applicationStatus"],
    applyUrl: app.apply_url ?? undefined,
  };
}

const COLUMN_CONFIG: { id: ApplicationStatus; title: string; statusColor: string }[] = [
  { id: "draft", title: "Draft", statusColor: "bg-slate-400" },
  { id: "applied", title: "Applied", statusColor: "bg-blue-500" },
  { id: "interviewing", title: "Interviewing", statusColor: "bg-amber-500" },
  { id: "offered", title: "Offers", statusColor: "bg-green-500" },
  { id: "rejected", title: "Rejected", statusColor: "bg-red-500" },
];

interface ColumnProps {
  title: string;
  status: ApplicationStatus;
  statusColor: string;
  applications: Application[];
  onDrop: (e: React.DragEvent, status: ApplicationStatus) => void;
  onDragOver: (e: React.DragEvent) => void;
  onAddJobClick: () => void;
  onSelectJob: (job: Job) => void;
  onViewApplication: (app: Application) => void;
  onPrepareJob: (job: Job) => void;
}

const Column: React.FC<ColumnProps> = ({
  title,
  status,
  statusColor,
  applications,
  onDrop,
  onDragOver,
  onAddJobClick,
  onSelectJob,
  onViewApplication,
  onPrepareJob,
}) => {
  return (
    <div
      className="flex-1 min-w-[300px] max-w-[320px] bg-slate-50/50 dark:bg-slate-900/20 rounded-3xl p-3 border border-slate-100 dark:border-slate-800 flex flex-col h-full transition-colors drag-target"
      onDragOver={onDragOver}
      onDrop={e => onDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
          <h3 className="font-medium text-slate-900 dark:text-white text-base">{title}</h3>
          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
            {applications.length}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <button
          type="button"
          onClick={onAddJobClick}
          className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-center gap-2 text-slate-400 text-xs font-medium hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
        >
          <Plus size={14} /> Add Application
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pb-2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        {applications.map((app: Application) => {
          const job = applicationToJob(app);
          return (
            <div
              key={app.application_id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData("applicationId", app.application_id);
                e.dataTransfer.effectAllowed = "move";
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <JobCard
                job={job}
                hideDescription
                hideButtons
                onClick={() => onViewApplication(app)}
                onPrepare={onPrepareJob}
                onApply={() => {}}
              />
            </div>
          );
        })}
        {applications.length === 0 && (
          <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs font-medium">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
};

interface ApplicationTrackerProps {
  onNavigateToStudio: (context: GeneratorContext) => void;
}

function ApplicationTracker(props: ApplicationTrackerProps): React.ReactElement {
  const { onNavigateToStudio } = props;
  const queryClient = useQueryClient();
  const { data: applications = [], isLoading } = useApplications();

  const [preparingJob, setPreparingJob] = useState<Job | null>(null);
  const [addModalInitialStatus, setAddModalInitialStatus] = useState<ApplicationStatus>("draft");
  const [tabState, setTabState] = useState<"toAdd" | "toView" | "toEdit" | "">("");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const handleDrop = async (e: React.DragEvent, newStatus: ApplicationStatus) => {
    e.preventDefault();
    const applicationId = e.dataTransfer.getData("applicationId");
    if (!applicationId) return;

    const app = applications.find(a => a.application_id === applicationId);
    if (!app) return;

    const previousList = [...applications];
    queryClient.setQueryData(
      ["applications"],
      previousList.map(a => (a.application_id === applicationId ? { ...a, status: newStatus } : a))
    );

    try {
      await updateApplication(applicationId, { ...app, status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
    } catch (err) {
      console.error("Failed to update application status:", err);
      queryClient.setQueryData(["applications"], previousList);
    }

    if (newStatus === "offered") {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      confetti({ particleCount: 80, spread: 60, origin: { x, y } });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleViewApplication = (app: Application) => {
    setSelectedApplication(app);
    setTabState("toView");
  };

  const handleAddClick = (initialStatus?: ApplicationStatus) => {
    setAddModalInitialStatus(initialStatus ?? "draft");
    setTabState("toAdd");
  };

  const handleCloseModal = () => {
    setTabState("");
    setSelectedApplication(null);
  };

  const handleAddSubmit = async (data: CreateApplicationInput) => {
    try {
      await createApplication(data);
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      handleCloseModal();
    } catch (err) {
      console.error("Failed to create application:", err);
    }
  };

  const handleCardUpdate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["applications"] });
    setSelectedApplication(null);
    setTabState("");
  };

  const handlePrepareFromDetails = (app: Application) => {
    setPreparingJob(applicationToJob(app));
  };

  const columnsByStatus = useMemo(() => {
    const map = new Map<ApplicationStatus, Application[]>();
    COLUMN_CONFIG.forEach(c => map.set(c.id, []));
    applications.forEach(app => {
      const list = map.get(app.status);
      if (list) list.push(app);
    });
    return map;
  }, [applications]);

  return isLoading ? (
    <div className="flex-1 h-full p-4 flex items-center justify-center">
      <div className="text-slate-500 dark:text-slate-400 text-sm">Loading applications...</div>
    </div>
  ) : (
    <div className="flex-1 h-full p-4 overflow-hidden">
      <div className="flex gap-4 h-full w-full max-w-[1400px] mx-auto overflow-x-auto pb-2">
        {COLUMN_CONFIG.map(({ id, title, statusColor }) => (
          <Column
            key={id}
            title={title}
            status={id}
            statusColor={statusColor}
            applications={columnsByStatus.get(id) ?? []}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onAddJobClick={() => handleAddClick(id)}
            onSelectJob={() => {}}
            onViewApplication={handleViewApplication}
            onPrepareJob={job => setPreparingJob(job)}
          />
        ))}
      </div>

      <ApplicationManager
        isOpen={tabState === "toAdd" || tabState === "toView" || tabState === "toEdit"}
        handleClose={handleCloseModal}
        tabState={tabState}
        setTabState={setTabState}
        selectedApplication={selectedApplication}
        setSelectedApplication={setSelectedApplication}
        onAdd={handleAddSubmit}
        handleCardUpdate={handleCardUpdate}
        initialStatusForAdd={addModalInitialStatus}
        onPrepare={handlePrepareFromDetails}
      />

      {preparingJob && <PrepareApplicationModal job={preparingJob} onClose={() => setPreparingJob(null)} />}
    </div>
  );
}

export default ApplicationTracker;
