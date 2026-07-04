"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import DebugConsole from "@/components/DebugConsole";
import OnboardingModal from "@/components/OnboardingModal";
import ProfileMenu from "@/components/ProfileMenu";
import UnicoachPricingModal, { OPEN_UNICOACH_PRICING_EVENT } from "@/components/UnicoachPricingModal";
import { AdkChatProvider } from "@/components/chat/AdkChatProvider";
import type { UnibotIncomingRequest, UnibotResumeSection } from "@/components/chat/unibot-incoming-request";
import OnboardingGateModal from "@/components/onboarding/OnboardingGateModal";
import { CoachActAsNavControls } from "@/components/uniboard/CoachActAsNavControls";
import type { CoachActAsSession } from "@/constants/coach-act-as";
import { CoachActAsProvider } from "@/contexts/CoachActAsContext";
import { OnboardingGateProvider, useOnboardingGate } from "@/features/onboarding/context/OnboardingGateContext";
import { parseFeatureGates, type FeatureGates } from "@/features/onboarding/featureGates";
import type { AtsFixPlanSection } from "@/features/resume/api/ats-fix-plan";
import { useUnicoachInit } from "@/features/unicoach/hooks/use-uniboard-unicoach";
import { useProfileData } from "@/features/user-profile/hooks/use-profile-data";
import { computeAdkUserId } from "@/utils/adkUserId";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const ChatSidebar = dynamic(() => import("@/components/ChatSidebar"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden
      className="relative z-20 flex h-full min-h-0 w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-slate-950"
    />
  ),
});

type UserData = {
  username?: string;
  name?: string;
  profilePictureUrl?: string;
  email?: string;
  firstName?: string;
  is_team_member?: boolean;
  profile_setup_required?: boolean;
  feature_gates?: FeatureGates;
  coach_actor?: {
    email?: string;
    name?: string;
    profilePictureUrl?: string | null;
  };
  profilePictureSources?: {
    unimad?: string | null;
    google?: string | null;
    linkedin?: string | null;
  };
};

function UniboardOnboardingGate({ userData }: { userData: UserData | null }) {
  const pathname = usePathname() || "";
  const {
    profileSetupRequired,
    profileSetupPromptOpen,
    dismissProfileSetupPrompt,
    blockingGateDismissed,
    dismissBlockingGate,
    resetBlockingGate,
  } = useOnboardingGate();

  useEffect(() => {
    resetBlockingGate();
  }, [pathname, resetBlockingGate]);

  const showPromptModal = profileSetupRequired && profileSetupPromptOpen;

  return (
    <OnboardingGateModal
      open={showPromptModal}
      pathname={pathname}
      userName={userData?.firstName || userData?.name}
      dismissible
      onDismiss={dismissProfileSetupPrompt}
    />
  );
}

const NAV_ITEMS = [
  { href: "/uniboard/resume", label: "Resume" },
  { href: "/uniboard/portfolio", label: "Portfolio" },
  { href: "/uniboard/linkedin", label: "LinkedIn" },
  { href: "/uniboard/jobs", label: "Jobs" },
  { href: "/uniboard/studio", label: "Studio" },
] as const;

const UNICOACH_NAV = { href: "/uniboard/unicoach", label: "Unicoach" } as const;

export default function UniboardShell({
  children,
  userData,
  coachActAsSession = null,
}: {
  children: React.ReactNode;
  userData: UserData | null;
  coachActAsSession?: CoachActAsSession | null;
}) {
  const isCoachActAs = Boolean(coachActAsSession);
  const adkUserId = computeAdkUserId(userData);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: liveProfile } = useProfileData();
  const { data: unicoachInit } = useUnicoachInit();
  const showUnicoachNav = !isCoachActAs && (Boolean(unicoachInit?.coach_data) || unicoachInit?.subscribed === true);
  const navItems = useMemo(() => (showUnicoachNav ? [...NAV_ITEMS, UNICOACH_NAV] : [...NAV_ITEMS]), [showUnicoachNav]);
  const [pendingAIRequest, setPendingAIRequest] = useState<UnibotIncomingRequest | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showUnicoachPricing, setShowUnicoachPricing] = useState(false);

  // Dark mode disabled for now — re-enable state + toggle when ready
  // const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isCoachActAs) {
      console.info("[coach-act-as] active in UniboardShell", coachActAsSession);
    }
  }, [isCoachActAs, coachActAsSession]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // useEffect(() => {
  //   if (isDarkMode) {
  //     document.documentElement.classList.add("dark");
  //   } else {
  //     document.documentElement.classList.remove("dark");
  //   }
  // }, [isDarkMode]);

  useEffect(() => {
    if (isCoachActAs) return;
    const handleOpenUnibot = (e: Event) => {
      const d = (
        e as CustomEvent<{
          type?: string;
          text?: string;
          section?: UnibotResumeSection;
          requestKey?: number;
          improveType?: string;
          topicTitle?: string;
          feature?: string;
          featureId?: string;
          entryId?: string;
          hasContent?: boolean;
          resumeId?: string;
          sections?: AtsFixPlanSection[];
          mainSessionTitle?: string;
        }>
      ).detail;
      if (!d) return;
      if (d.type === "ats_fix_batch" && d.resumeId && d.sections?.length) {
        setPendingAIRequest({
          type: "ats_fix_batch",
          resumeId: d.resumeId,
          sections: d.sections,
          mainSessionTitle: d.mainSessionTitle,
          requestKey: typeof d.requestKey === "number" ? d.requestKey : Date.now(),
        });
        return;
      }
      if (d.type === "improve" || ((d.improveType === "resume" || d.improveType === "linkedin") && d.featureId && d.section)) {
        setPendingAIRequest({
          type: "improve",
          text: d.text ?? "",
          improveType: d.improveType ?? "resume",
          topicTitle: d.topicTitle,
          feature: d.feature,
          featureId: d.featureId,
          section: d.section,
          entryId: d.entryId,
          hasContent: d.hasContent,
          requestKey: typeof d.requestKey === "number" ? d.requestKey : undefined,
        });
        return;
      }
      if (d.section && d.requestKey != null && !d.featureId) {
        setPendingAIRequest({
          type: "section_review",
          section: d.section,
          requestKey: typeof d.requestKey === "number" ? d.requestKey : Date.now(),
        });
        return;
      }
      if (d.text != null && d.text !== "") {
        setPendingAIRequest({
          type: "improve",
          text: d.text,
          improveType: d.improveType,
          topicTitle: d.topicTitle,
          requestKey: typeof d.requestKey === "number" ? d.requestKey : undefined,
        });
      }
    };
    const handleOpenContentGenTopic = (e: Event) => {
      const d = (
        e as CustomEvent<{
          seedTopic?: string;
          followUpText?: string;
          topicTitle?: string;
          reuseExistingTopic?: boolean;
          improveDraft?: boolean;
          assetId?: string;
          funnel?: import("@/features/content-lab/api/adk-mappers").ContentGenFunnel;
          requestKey?: number;
        }>
      ).detail;
      setPendingAIRequest({
        type: "content_gen_topic",
        seedTopic: d?.seedTopic,
        followUpText: d?.followUpText,
        topicTitle: d?.topicTitle,
        reuseExistingTopic: d?.reuseExistingTopic,
        improveDraft: d?.improveDraft,
        assetId: d?.assetId,
        funnel: d?.funnel,
        requestKey: typeof d?.requestKey === "number" ? d.requestKey : Date.now(),
      });
    };
    window.addEventListener("open-unibot", handleOpenUnibot);
    window.addEventListener("open-content-gen-topic", handleOpenContentGenTopic);
    return () => {
      window.removeEventListener("open-unibot", handleOpenUnibot);
      window.removeEventListener("open-content-gen-topic", handleOpenContentGenTopic);
    };
  }, [isCoachActAs]);

  useEffect(() => {
    const openPricing = () => setShowUnicoachPricing(true);
    window.addEventListener(OPEN_UNICOACH_PRICING_EVENT, openPricing);
    return () => window.removeEventListener(OPEN_UNICOACH_PRICING_EVENT, openPricing);
  }, []);

  const handleUnicoachPaymentSuccess = () => {
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "init"] });
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "journey-state"] });
    void queryClient.invalidateQueries({ queryKey: ["unicoach", "profile-info"] });
    router.push("/uniboard/unicoach");
  };

  // const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  const profileMenuUser = useMemo(
    () => ({
      name: liveProfile?.name ?? userData?.name,
      email: liveProfile?.email ?? userData?.email,
      firstName: userData?.firstName,
      is_team_member: userData?.is_team_member,
      profilePictureUrl: liveProfile?.profilePictureUrl ?? userData?.profilePictureUrl,
      profilePictureSources: liveProfile?.profilePictureSources ?? userData?.profilePictureSources,
    }),
    [liveProfile, userData]
  );

  const getAvailablePopups = () => [
    // Dark mode disabled for now — re-enable when ready
    // {
    //   id: "theme",
    //   label: `Toggle ${isDarkMode ? "Light" : "Dark"} Mode`,
    //   onClick: toggleDarkMode,
    // },
  ];

  const isOnboardingRoute = pathname.startsWith("/uniboard/onboarding");

  if (isOnboardingRoute) {
    return <>{children}</>;
  }

  return (
    <CoachActAsProvider session={coachActAsSession}>
      <OnboardingGateProvider
        profileSetupRequired={Boolean(userData?.profile_setup_required && !isCoachActAs)}
        featureGates={parseFeatureGates(userData?.feature_gates)}
      >
        <AdkChatProvider userId={adkUserId}>
          <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 text-[13px] transition-colors duration-300">
            <Suspense fallback={null}>
              <ChatSidebar
                incomingRequest={isCoachActAs ? null : pendingAIRequest}
                onRequestHandled={() => setPendingAIRequest(null)}
                coachActAsReadOnly={isCoachActAs}
              />
            </Suspense>

            <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
              <header
                className={`sticky top-0 z-[100] flex h-16 min-h-[4rem] flex-none border-b bg-white/80 font-sans backdrop-blur-md transition-colors dark:bg-slate-950/80 ${
                  isCoachActAs
                    ? "border-brand-500 ring-2 ring-inset ring-brand-500/30 dark:border-brand-400"
                    : "border-slate-100 dark:border-white/5"
                }`}
              >
                <div className="flex h-full w-full items-center justify-between gap-4 px-6">
                  <nav className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
                    {navItems.map(({ href, label }) => {
                      const isActive = pathname === href || (href !== "/uniboard/resume" && pathname.startsWith(href));
                      const isResumeLanding = href === "/uniboard/resume";
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={e => {
                            if (!isResumeLanding || pathname !== href) return;
                            if (typeof window === "undefined" || !window.location.search.includes("id=")) return;
                            e.preventDefault();
                            router.replace(href, { scroll: false });
                          }}
                          className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                            isActive
                              ? "bg-slate-100 dark:bg-brand-500/10 text-slate-900 dark:text-brand-400"
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5"
                          }`}
                        >
                          {label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="flex shrink-0 items-center gap-4">
                    {!isCoachActAs && !showUnicoachNav ? (
                      <Link
                        href="/uniboard/unicoach"
                        className="hidden sm:inline-flex bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 rounded-full text-xs font-medium shadow-sm transition-transform active:scale-95 items-center gap-2"
                      >
                        Hire a Career Coach
                      </Link>
                    ) : null}
                    {isCoachActAs && coachActAsSession ? (
                      <CoachActAsNavControls
                        session={coachActAsSession}
                        studentPictureUrl={userData?.profilePictureUrl ?? liveProfile?.profilePictureUrl}
                        coachPictureUrl={userData?.coach_actor?.profilePictureUrl}
                        coachDisplayName={userData?.coach_actor?.name}
                      />
                    ) : (
                      <>
                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block mx-2" />
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                          aria-label="Notifications"
                        >
                          <Bell size={18} />
                        </button>
                        <ProfileMenu userData={profileMenuUser} />
                      </>
                    )}
                  </div>
                </div>
              </header>

              <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
            </div>

            {!pathname.includes("/uniboard/unicoach") ? (
              <DebugConsole context={pathname} popups={getAvailablePopups()} onAddPopup={() => alert(`Add new popup for ${pathname}`)} />
            ) : null}

            {showOnboardingModal && <OnboardingModal onComplete={() => setShowOnboardingModal(false)} />}

            {showUnicoachPricing ? (
              <UnicoachPricingModal onClose={() => setShowUnicoachPricing(false)} onPaymentSuccess={handleUnicoachPaymentSuccess} />
            ) : null}

            <UniboardOnboardingGate userData={userData} />
          </div>
        </AdkChatProvider>
      </OnboardingGateProvider>
    </CoachActAsProvider>
  );
}
