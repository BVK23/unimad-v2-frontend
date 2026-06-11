"use client";

import React from "react";
import type { ValidationError } from "@/utils/validation";
import { AlertCircle } from "lucide-react";

type ResumeFieldErrorProps = {
  errors: ValidationError[];
  section: ValidationError["section"];
  field: string;
  id?: string;
  visible: boolean;
};

const ResumeFieldError: React.FC<ResumeFieldErrorProps> = ({ errors, section, field, id, visible }) => {
  if (!visible) return null;

  const error = errors.find(e => e.section === section && e.field === field && e.id === id);
  if (!error) return null;

  return (
    <p className="text-[11px] text-red-500 font-medium mt-1 ml-1 flex items-center gap-1">
      <AlertCircle size={10} /> {error.message}
    </p>
  );
};

export default ResumeFieldError;
