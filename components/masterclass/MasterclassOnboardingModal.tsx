/* eslint-disable @typescript-eslint/ban-ts-comment -- v1 port; types tightened in follow-up */
// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { MASTERCLASS_SUPPORT_EMAIL } from "@/constants/masterclass";
import { X } from "lucide-react";

const ONBOARDING_COPY = {
  booking: {
    details: {
      title: "Book your free onboarding call",
      description: "Share your details and we'll help you get started with the Unimad Career Positioning System.",
      submitLabel: "Continue",
    },
    questions: {
      title: "A few quick questions",
      description: "Help us tailor your discovery call to your situation.",
      nextLabel: "Next",
      submitLabel: "Continue to booking",
    },
  },
  video: {
    title: "Unlock Masterclass",
    description: "Share your details to unlock the full masterclass preview and continue with your free onboarding call.",
    submitLabel: "Watch Masterclass",
  },
};

const CURRENT_STATUS_OPTIONS = ["Pursuing Master's now", "Recently completed Master's", "Completed a while ago", "Other"];

const COUNTRY_OPTIONS = ["UK", "Ireland", "US", "Canada", "Other"];

const TARGET_ROLE_OPTIONS = [
  "Data Analyst / Data Scientist / Data Engineer",
  "Business Analyst",
  "Financial Analyst",
  "UI/UX Designer",
  "Software Engineer",
  "Marketing",
  "Other",
];

const JOB_SEARCH_OPTIONS = [
  "Just starting out",
  "Applying but not getting interviews",
  "Getting interviews but not offers",
  "Not actively searching yet",
  "Other",
];

const INVESTING_OPTIONS = ["Yes", "Not sure yet", "No"];

const DISCOVERY_QUESTIONS = [
  {
    id: "currentStatus",
    title: "What's your current status?",
    type: "radio",
    options: CURRENT_STATUS_OPTIONS,
    otherField: "currentStatusOther",
  },
  {
    id: "country",
    title: "Which country are you based in?",
    type: "radio",
    options: COUNTRY_OPTIONS,
    otherField: "countryOther",
  },
  {
    id: "targetRoles",
    title: "Which field best describes your target role?",
    type: "checkbox",
    options: TARGET_ROLE_OPTIONS,
    otherField: "targetRoleOther",
  },
  {
    id: "jobSearchStatus",
    title: "How would you describe your job search right now?",
    type: "checkbox",
    options: JOB_SEARCH_OPTIONS,
    otherField: "jobSearchOther",
  },
  {
    id: "investing",
    title: "Are you open to investing in a guided programme if it gets you hired faster?",
    type: "radio",
    options: INVESTING_OPTIONS,
  },
];

const COUNTRY_DIAL_CODES = [
  { code: "+44", label: "UK" },
  { code: "+353", label: "Ireland" },
  { code: "+1", label: "US / Canada" },
  { code: "+61", label: "Australia" },
  { code: "+64", label: "New Zealand" },
  { code: "+91", label: "India" },
  { code: "+92", label: "Pakistan" },
  { code: "+880", label: "Bangladesh" },
  { code: "+94", label: "Sri Lanka" },
  { code: "+977", label: "Nepal" },
  { code: "+65", label: "Singapore" },
  { code: "+60", label: "Malaysia" },
  { code: "+63", label: "Philippines" },
  { code: "+62", label: "Indonesia" },
  { code: "+971", label: "UAE" },
  { code: "+966", label: "Saudi Arabia" },
  { code: "+974", label: "Qatar" },
  { code: "+234", label: "Nigeria" },
  { code: "+27", label: "South Africa" },
  { code: "+254", label: "Kenya" },
  { code: "+233", label: "Ghana" },
  { code: "+86", label: "China" },
  { code: "+852", label: "Hong Kong" },
  { code: "+81", label: "Japan" },
  { code: "+82", label: "South Korea" },
  { code: "+886", label: "Taiwan" },
  { code: "+49", label: "Germany" },
  { code: "+33", label: "France" },
  { code: "+31", label: "Netherlands" },
  { code: "+34", label: "Spain" },
  { code: "+39", label: "Italy" },
  { code: "+48", label: "Poland" },
  { code: "+351", label: "Portugal" },
  { code: "+55", label: "Brazil" },
  { code: "+52", label: "Mexico" },
  { code: "+57", label: "Colombia" },
];

const CUSTOM_DIAL_VALUE = "__custom__";
const SUBMIT_ERROR_MESSAGE = `Something went wrong. Please try again or contact ${MASTERCLASS_SUPPORT_EMAIL} so we can help.`;

function emptyDiscovery() {
  return {
    currentStatus: "",
    currentStatusOther: "",
    country: "",
    countryOther: "",
    targetRoles: [],
    targetRoleOther: "",
    jobSearchStatus: [],
    jobSearchOther: "",
    openToInvesting: "",
  };
}

function normalizeDialCode(value) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return `+${digits}`;
}

function isValidDialCode(code) {
  return /^\+[1-9]\d{0,3}$/.test(code);
}

function validateDiscoveryQuestion(question, discovery) {
  if (question.id === "currentStatus") {
    if (!discovery.currentStatus) return "Please select your current status.";
    if (discovery.currentStatus === "Other" && !discovery.currentStatusOther?.trim()) {
      return "Please tell us your current status.";
    }
    return null;
  }
  if (question.id === "country") {
    if (!discovery.country) return "Please select your country.";
    if (discovery.country === "Other" && !discovery.countryOther?.trim()) {
      return "Please tell us which country you're based in.";
    }
    return null;
  }
  if (question.id === "targetRoles") {
    if (discovery.targetRoles.length === 0) return "Please select at least one target role.";
    if (discovery.targetRoles.includes("Other") && !discovery.targetRoleOther?.trim()) {
      return "Please describe your target role.";
    }
    return null;
  }
  if (question.id === "jobSearchStatus") {
    if (discovery.jobSearchStatus.length === 0) {
      return "Please select at least one option for your job search.";
    }
    if (discovery.jobSearchStatus.includes("Other") && !discovery.jobSearchOther?.trim()) {
      return "Please describe your job search situation.";
    }
    return null;
  }
  if (!discovery.openToInvesting) {
    return "Please let us know if you're open to investing in a guided programme.";
  }
  return null;
}

function OptionRow({ name, type, label, checked, onChange }) {
  return (
    <label className="masterclass-onboarding-option">
      <input type={type} name={name} checked={checked} onChange={onChange} className="masterclass-onboarding-option__control" />
      <span className="masterclass-onboarding-option__label">{label}</span>
    </label>
  );
}

export function MasterclassOnboardingModal({
  open,
  intent = "booking",
  initialStep = "details",
  initialLead = null,
  theme = "dark",
  skipContactStep = false,
  onClose,
  onSubmit,
}) {
  const [bookingStep, setBookingStep] = useState(initialStep);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [name, setName] = useState(initialLead?.name || "");
  const [email, setEmail] = useState(initialLead?.email || "");
  const [dialSelection, setDialSelection] = useState("+44");
  const [customDialCode, setCustomDialCode] = useState("");
  const [phone, setPhone] = useState("");
  const [discovery, setDiscovery] = useState(emptyDiscovery);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCustomDial = dialSelection === CUSTOM_DIAL_VALUE;
  const effectiveDialCode = isCustomDial ? normalizeDialCode(customDialCode) : dialSelection;

  useEffect(() => {
    if (!open) return;

    setBookingStep(initialStep);
    setQuestionIndex(0);
    setName(initialLead?.name || "");
    setEmail(initialLead?.email || "");
    setDiscovery(emptyDiscovery());
    setError("");
    setIsSubmitting(false);
  }, [open, initialStep, initialLead]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = event => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, isSubmitting]);

  if (!open) return null;

  const isBooking = intent === "booking";
  const copy =
    isBooking && bookingStep === "questions"
      ? ONBOARDING_COPY.booking.questions
      : isBooking
        ? ONBOARDING_COPY.booking.details
        : ONBOARDING_COPY.video;

  const totalQuestions = DISCOVERY_QUESTIONS.length;
  const currentQuestion = DISCOVERY_QUESTIONS[questionIndex];
  const progressPercent = Math.round(((questionIndex + 1) / totalQuestions) * 100);

  const validateContactFields = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.replace(/\D/g, "");

    if (!trimmedName) return "Please enter your name.";
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }
    if (trimmedPhone.length < 6) return "Please enter a valid phone number.";
    if (!isValidDialCode(effectiveDialCode)) {
      return "Please enter a valid country code (e.g. +44).";
    }
    return null;
  };

  const handleDetailsSubmit = async event => {
    event.preventDefault();
    setError("");

    const validationError = validateContactFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isBooking) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          stage: "contact",
          name: name.trim(),
          email: email.trim(),
          dialCode: effectiveDialCode,
          phone: phone.replace(/\D/g, ""),
          uid: initialLead?.uid,
        });
        setBookingStep("questions");
        setQuestionIndex(0);
      } catch (submitError) {
        setError(submitError?.message || SUBMIT_ERROR_MESSAGE);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        stage: "complete",
        name: name.trim(),
        email: email.trim(),
        dialCode: effectiveDialCode,
        phone: phone.replace(/\D/g, ""),
      });
    } catch (submitError) {
      setError(submitError?.message || SUBMIT_ERROR_MESSAGE);
      setIsSubmitting(false);
    }
  };

  const handleQuestionStep = async event => {
    event.preventDefault();
    setError("");

    const validationError = validateDiscoveryQuestion(currentQuestion, discovery);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (questionIndex < totalQuestions - 1) {
      setQuestionIndex(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        stage: "complete",
        name: name.trim(),
        email: email.trim(),
        dialCode: effectiveDialCode,
        phone: phone.replace(/\D/g, ""),
        uid: initialLead?.uid,
        discovery: {
          currentStatus: discovery.currentStatus,
          currentStatusOther: discovery.currentStatus === "Other" ? discovery.currentStatusOther?.trim() : undefined,
          country: discovery.country,
          countryOther: discovery.country === "Other" ? discovery.countryOther?.trim() : undefined,
          targetRoles: discovery.targetRoles,
          targetRoleOther: discovery.targetRoles.includes("Other") ? discovery.targetRoleOther?.trim() : undefined,
          jobSearchStatus: discovery.jobSearchStatus,
          jobSearchOther: discovery.jobSearchStatus.includes("Other") ? discovery.jobSearchOther?.trim() : undefined,
          openToInvesting: discovery.openToInvesting,
        },
      });
    } catch (submitError) {
      setError(submitError?.message || SUBMIT_ERROR_MESSAGE);
      setIsSubmitting(false);
    }
  };

  const handleQuestionBack = () => {
    setError("");
    if (questionIndex > 0) {
      setQuestionIndex(prev => prev - 1);
      return;
    }
    if (skipContactStep) return;
    setBookingStep("details");
  };

  const toggleCheckbox = (field, value) => {
    setDiscovery(prev => {
      const current = prev[field];
      const next = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
      return { ...prev, [field]: next };
    });
  };

  const showOtherInput =
    currentQuestion?.otherField &&
    ((currentQuestion.id === "currentStatus" && discovery.currentStatus === "Other") ||
      (currentQuestion.id === "country" && discovery.country === "Other") ||
      (currentQuestion.id === "targetRoles" && discovery.targetRoles.includes("Other")) ||
      (currentQuestion.id === "jobSearchStatus" && discovery.jobSearchStatus.includes("Other")));

  const otherValue = currentQuestion?.otherField && showOtherInput ? discovery[currentQuestion.otherField] || "" : "";

  const isLight = theme === "light";

  return (
    <div
      className={`fixed inset-0 ${isLight ? "z-[210]" : "z-[100]"} flex items-end justify-center p-0 sm:items-center sm:p-6 ${isLight ? "unicoach-discovery-form" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="masterclass-onboarding-title"
    >
      <button
        type="button"
        className={`absolute inset-0 backdrop-blur-sm ${isLight ? "bg-slate-900/40" : "bg-[#0a0f18]/75"}`}
        aria-hidden
        tabIndex={-1}
        onClick={isSubmitting ? undefined : onClose}
      />

      <button
        type="button"
        onClick={isSubmitting ? undefined : onClose}
        className={`fixed right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[101] p-1.5 transition-colors sm:right-5 sm:top-5 ${
          isLight ? "text-slate-400 hover:text-slate-600" : "text-[#eaeaea]/40 hover:text-[#eaeaea]/70"
        }`}
        aria-label="Close"
      >
        <X size={16} strokeWidth={2} />
      </button>

      <div
        className={`masterclass-onboarding-modal relative z-10 max-h-[min(92dvh,720px)] w-full max-w-[440px] overflow-y-auto rounded-t-[18px] sm:rounded-[14px] ${
          isLight ? "border border-slate-200 bg-white shadow-xl" : ""
        }`}
      >
        {isSubmitting ? (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[inherit] backdrop-blur-sm ${
              isLight ? "bg-white/90" : "bg-[#0a0f18]/90"
            }`}
            role="status"
            aria-live="polite"
          >
            <div
              className={`h-9 w-9 animate-spin rounded-full border-2 ${isLight ? "border-slate-200 border-t-brand-600" : "border-white/20 border-t-[#346de0]"}`}
            />
            <p className={`text-[13px] tracking-[-0.26px] ${isLight ? "text-slate-500" : "text-[#eaeaea]/75"}`}>Saving your details…</p>
          </div>
        ) : null}

        <div className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pb-8 sm:pt-9">
          {isBooking && bookingStep === "questions" ? (
            <>
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  {skipContactStep && questionIndex === 0 ? (
                    <span aria-hidden className="inline-block w-12" />
                  ) : (
                    <button
                      type="button"
                      onClick={handleQuestionBack}
                      className={`text-[12px] font-medium tracking-[-0.24px] transition-colors ${
                        isLight ? "text-slate-400 hover:text-slate-600" : "text-[#eaeaea]/50 hover:text-[#eaeaea]/75"
                      }`}
                    >
                      ← Back
                    </button>
                  )}
                  <span className={`text-[11px] font-medium tracking-[-0.22px] ${isLight ? "text-slate-400" : "text-[#eaeaea]/50"}`}>
                    {progressPercent}%
                  </span>
                </div>
                <div
                  className="masterclass-onboarding-progress"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="masterclass-onboarding-progress__fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <h2
                id="masterclass-onboarding-title"
                className={`mb-4 text-[18px] font-medium leading-[1.25] tracking-[-0.36px] sm:text-[20px] ${
                  isLight ? "text-slate-900" : "text-[#eaeaea]"
                }`}
              >
                {currentQuestion.title}
              </h2>

              <form className="space-y-4" onSubmit={handleQuestionStep} noValidate>
                <fieldset className="space-y-2">
                  <legend className="sr-only">{currentQuestion.title}</legend>
                  {currentQuestion.options.map(option => {
                    if (currentQuestion.type === "radio") {
                      const field =
                        currentQuestion.id === "currentStatus"
                          ? "currentStatus"
                          : currentQuestion.id === "country"
                            ? "country"
                            : "openToInvesting";
                      return (
                        <OptionRow
                          key={option}
                          name={currentQuestion.id}
                          type="radio"
                          label={option}
                          checked={discovery[field] === option}
                          onChange={() => setDiscovery(prev => ({ ...prev, [field]: option }))}
                        />
                      );
                    }

                    const field = currentQuestion.id === "targetRoles" ? "targetRoles" : "jobSearchStatus";
                    return (
                      <OptionRow
                        key={option}
                        name={currentQuestion.id}
                        type="checkbox"
                        label={option}
                        checked={discovery[field].includes(option)}
                        onChange={() => toggleCheckbox(field, option)}
                      />
                    );
                  })}
                  {showOtherInput && currentQuestion.otherField ? (
                    <input
                      type="text"
                      value={otherValue}
                      onChange={e =>
                        setDiscovery(prev => ({
                          ...prev,
                          [currentQuestion.otherField]: e.target.value,
                        }))
                      }
                      placeholder="Please specify"
                      className="masterclass-onboarding-input mt-1"
                    />
                  ) : null}
                </fieldset>

                {error ? (
                  <p className="text-[12px] leading-normal text-[#e35959]" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${isLight ? "w-full rounded-xl bg-brand-600 py-3 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60" : "masterclass-blue-btn masterclass-blue-btn--modal disabled:opacity-60"}`}
                >
                  <span className="relative z-10 px-2">
                    {questionIndex < totalQuestions - 1
                      ? ONBOARDING_COPY.booking.questions.nextLabel
                      : ONBOARDING_COPY.booking.questions.submitLabel}
                  </span>
                </button>
              </form>
            </>
          ) : (
            <>
              <h2
                id="masterclass-onboarding-title"
                className={`text-[22px] font-medium leading-[1.2] tracking-[-0.44px] sm:text-[24px] ${
                  isLight ? "text-slate-900" : "text-[#eaeaea]"
                }`}
              >
                {copy.title}
              </h2>
              <p className={`mt-2 text-[13px] leading-normal tracking-[-0.26px] ${isLight ? "text-slate-500" : "text-[#eaeaea]/65"}`}>
                {copy.description}
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleDetailsSubmit} noValidate>
                <div className="space-y-1.5">
                  <label htmlFor="masterclass-name" className="masterclass-onboarding-label">
                    Name
                  </label>
                  <input
                    id="masterclass-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="masterclass-onboarding-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="masterclass-email" className="masterclass-onboarding-label">
                    Email
                  </label>
                  <input
                    id="masterclass-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="masterclass-onboarding-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="masterclass-phone" className="masterclass-onboarding-label">
                    Phone number
                  </label>
                  <div className="masterclass-phone-row">
                    {isCustomDial ? (
                      <input
                        id="masterclass-dial-code"
                        type="tel"
                        inputMode="tel"
                        value={customDialCode}
                        onChange={e => setCustomDialCode(normalizeDialCode(e.target.value))}
                        placeholder="+00"
                        className="masterclass-onboarding-input masterclass-onboarding-dial-select"
                        aria-label="Country code"
                      />
                    ) : (
                      <select
                        id="masterclass-dial-code"
                        value={dialSelection}
                        onChange={e => setDialSelection(e.target.value)}
                        className="masterclass-onboarding-input masterclass-onboarding-select masterclass-onboarding-dial-select"
                        aria-label="Country code"
                      >
                        {COUNTRY_DIAL_CODES.map(({ code, label }) => (
                          <option key={`${code}-${label}`} value={code}>
                            {code} — {label}
                          </option>
                        ))}
                        <option value={CUSTOM_DIAL_VALUE}>Other country code…</option>
                      </select>
                    )}
                    <input
                      id="masterclass-phone"
                      type="tel"
                      autoComplete="tel-national"
                      inputMode="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="masterclass-onboarding-input masterclass-onboarding-phone-input"
                    />
                  </div>
                </div>

                {/* LinkedIn URL — disabled for now; may re-enable later
                <div className="space-y-1.5">
                  <label htmlFor="masterclass-linkedin" className="masterclass-onboarding-label">
                    LinkedIn URL
                  </label>
                  <input id="masterclass-linkedin" type="url" className="masterclass-onboarding-input" />
                </div>
                */}

                {error ? (
                  <p className="text-[12px] leading-normal text-[#e35959]" role="alert">
                    {error}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="masterclass-blue-btn masterclass-blue-btn--modal disabled:opacity-60"
                >
                  <span className="relative z-10 px-2">{copy.submitLabel}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
