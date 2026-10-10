import { ArrowRight, Check } from "lucide-react";

import styles from "./guided-flow.module.css";

export interface GuidedFlowStep {
  label: string;
  description: string;
}

interface GuidedFlowProps {
  steps: readonly GuidedFlowStep[];
  currentStep: number;
  label: string;
}

export function GuidedFlow({ steps, currentStep, label }: GuidedFlowProps) {
  return (
    <ol className={styles.flow} aria-label={label}>
      {steps.map((step, index) => {
        const number = index + 1;
        const done = number < currentStep;
        const active = number === currentStep;
        return (
          <li key={step.label} data-active={active} data-done={done} aria-current={active ? "step" : undefined}>
            <span className={styles.number} aria-hidden="true">{done ? <Check size={18} strokeWidth={3} /> : number}</span>
            <span className={styles.copy}>
              <strong>{step.label}</strong>
              <small>{step.description}</small>
            </span>
            {number < steps.length ? <ArrowRight className={styles.arrow} aria-hidden="true" size={22} /> : null}
          </li>
        );
      })}
    </ol>
  );
}
