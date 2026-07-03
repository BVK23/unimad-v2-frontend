"use client";

import { UnicoachPlanPaymentModal } from "@/components/unicoach/UnicoachPlanPaymentModal";

type MasterclassFullProgramPaymentModalProps = {
  open: boolean;
  onClose: () => void;
};

/** @deprecated Use UnicoachPlanPaymentModal with planId instead. */
export function MasterclassFullProgramPaymentModal({ open, onClose }: MasterclassFullProgramPaymentModalProps) {
  return <UnicoachPlanPaymentModal open={open} onClose={onClose} planId="unicoach_program" />;
}
