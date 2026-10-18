"use client";

import { useCallback, useEffect, useRef } from "react";

const STEP_KEY = "cardfolioStep";

interface StepEntry<T> {
  scope: string;
  step: T;
}

function readStepEntry<T>(value: unknown): StepEntry<T> | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = (value as Record<string, unknown>)[STEP_KEY];
  if (!candidate || typeof candidate !== "object") return undefined;
  const { scope, step } = candidate as Record<string, unknown>;
  return typeof scope === "string" && (typeof step === "string" || typeof step === "number") ? { scope, step: step as T } : undefined;
}

function stateWithStep<T>(scope: string, step: T): Record<string, unknown> {
  const current = window.history.state;
  const base = current && typeof current === "object" ? current as Record<string, unknown> : {};
  return { ...base, [STEP_KEY]: { scope, step } };
}

/**
 * Makes the steps of a multi-step panel part of the browser history: the browser's Back button (and the panel's
 * own "Zurück") goes one step back instead of leaving the whole flow. The other history data is kept untouched.
 */
export function useStepHistory<T extends string | number>(scope: string, step: T, setStep: (next: T) => void): (next: T) => void {
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);
  const visited = useRef<T[]>([step]);

  useEffect(() => {
    const existing = readStepEntry<T>(window.history.state);
    if (existing?.scope !== scope || existing.step !== stepRef.current) {
      window.history.replaceState(stateWithStep(scope, stepRef.current), "", window.location.href);
    }
    const onPop = () => {
      const entry = readStepEntry<T>(window.history.state);
      if (!entry || entry.scope !== scope || entry.step === stepRef.current) return;
      const index = visited.current.lastIndexOf(entry.step);
      visited.current = index >= 0 ? visited.current.slice(0, index + 1) : [entry.step];
      setStep(entry.step);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [scope, setStep]);

  return useCallback((next: T) => {
    if (next === stepRef.current) return;
    const stack = visited.current;
    if (stack.length > 1 && stack[stack.length - 2] === next) {
      // Going back one step is the same as pressing the browser's Back button.
      visited.current = stack.slice(0, -1);
      setStep(next);
      window.history.back();
      return;
    }
    visited.current = [...stack, next];
    window.history.pushState(stateWithStep(scope, next), "", window.location.href);
    setStep(next);
  }, [scope, setStep]);
}
