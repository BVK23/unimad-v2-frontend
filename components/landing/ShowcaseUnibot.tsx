"use client";

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from "react";
import { getSigninUrl } from "@/constants/landing-auth";
import { storeLandingUnibotDraft } from "@/constants/landing-unibot";
import { useAuthStatus } from "@/hooks/useAuthStatus";
import { useRouter } from "next/navigation";

const TYPE_MS = 42;
const DELETE_MS = 24;
const PAUSE_MS = 2400;

type ShowcaseUnibotProps = {
  prompts: string[];
};

export function ShowcaseUnibot({ prompts }: ShowcaseUnibotProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStatus();
  const [promptIndex, setPromptIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState<"typing" | "deleting">("typing");
  const [isEditing, setIsEditing] = useState(false);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPromptIndex(0);
    setDisplay("");
    setPhase("typing");
    setIsEditing(false);
    setUserInput("");
  }, [prompts]);

  useEffect(() => {
    if (isEditing || prompts.length === 0) return;

    const text = prompts[promptIndex] ?? "";
    let timer: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (display.length < text.length) {
        timer = setTimeout(() => {
          setDisplay(text.slice(0, display.length + 1));
        }, TYPE_MS);
      } else {
        timer = setTimeout(() => setPhase("deleting"), PAUSE_MS);
      }
    } else if (display.length > 0) {
      timer = setTimeout(() => {
        setDisplay(display.slice(0, -1));
      }, DELETE_MS);
    } else {
      setPromptIndex(current => (current + 1) % prompts.length);
      setPhase("typing");
    }

    return () => clearTimeout(timer);
  }, [prompts, promptIndex, display, phase, isEditing]);

  const activateEditing = () => {
    setIsEditing(true);
    setUserInput("");
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const stopEditing = () => {
    setIsEditing(false);
    setUserInput("");
  };

  const submitMessage = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) {
      stopEditing();
      return;
    }

    storeLandingUnibotDraft(trimmed);
    router.push(isAuthenticated ? "/uniboard/resume" : getSigninUrl("resume"));
  };

  const handleSend = () => {
    if (!isEditing) {
      activateEditing();
      return;
    }
    submitMessage(userInput);
  };

  return (
    <div
      className={`unibot-bar unibot-bar--inscreen${isEditing ? " is-editing" : ""}`}
      onClick={!isEditing ? activateEditing : undefined}
      onKeyDown={
        !isEditing
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activateEditing();
              }
            }
          : undefined
      }
      role={isEditing ? undefined : "button"}
      tabIndex={isEditing ? -1 : 0}
      aria-label={isEditing ? undefined : "Click to ask unibot"}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="ub-input"
          value={userInput}
          onChange={e => setUserInput(e.target.value)}
          onBlur={stopEditing}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              submitMessage(userInput);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              stopEditing();
            }
          }}
          placeholder="Ask unibot anything..."
          aria-label="Message unibot"
        />
      ) : (
        <span className="ub-text ub-text--type" aria-live="polite">
          {display}
          <span className="ub-cursor">|</span>
        </span>
      )}
      <button
        type="button"
        className="ub-send"
        aria-label="Send message"
        onMouseDown={e => e.preventDefault()}
        onClick={e => {
          e.stopPropagation();
          handleSend();
        }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 13V3M8 3L4 7M8 3L12 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
