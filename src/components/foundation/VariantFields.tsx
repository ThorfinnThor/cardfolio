import type { CardVariantAvailability, PurchasePreferences, VariantSelection } from "@/domain/types";
import { minimumConditionLabels } from "@/domain/purchase-preferences";
import {
  areFinishesVerified,
  availableEditionValues,
  availableFinishValues,
  availablePrintingValues,
  editionLabels,
  finishLabels,
  formatAvailableVariants,
  printingLabels,
  requiresVariantLabel,
  selectedPrinting,
  variantSelectionIssue,
  type CardVariantOptions,
} from "@/domain/variant-selection";

import styles from "./foundation-workspace.module.css";

interface VariantFieldsProps {
  variant: VariantSelection;
  preferences: PurchasePreferences;
  availability?: CardVariantAvailability | CardVariantOptions;
  onVariantChange: (variant: VariantSelection) => void;
  onPreferencesChange: (preferences: PurchasePreferences) => void;
}

export function VariantFields({
  variant,
  preferences,
  availability,
  onVariantChange,
  onPreferencesChange,
}: VariantFieldsProps) {
  const finishValues = availableFinishValues(availability, variant.edition);
  const editionValues = availableEditionValues(availability);
  const printingValues = availablePrintingValues(availability, variant.edition);
  const printing = selectedPrinting(variant);
  const issue = variantSelectionIssue(variant, availability);
  const labelRequired = requiresVariantLabel(variant, availability);

  return (
    <>
      <div className={styles.variantForm}>
        <label>
          Finish
          <select
            required
            value={variant.finish}
            onChange={(event) => onVariantChange({ ...variant, finish: event.target.value as VariantSelection["finish"] })}
          >
            {!finishValues.includes(variant.finish) ? <option value={variant.finish} disabled>{finishLabels[variant.finish]} · nicht bestätigt</option> : null}
            {finishValues.map((value) => <option value={value} key={value}>{finishLabels[value]}</option>)}
          </select>
        </label>
        <label>
          Edition
          <select
            required
            value={variant.edition}
            onChange={(event) => {
              const edition = event.target.value as VariantSelection["edition"];
              const compatiblePrintings = availablePrintingValues(availability, edition);
              const compatibleFinishes = availableFinishValues(availability, edition);
              const concreteFinishes = compatibleFinishes.filter((value) => value !== "unspecified" && value !== "other");
              onVariantChange({
                ...variant,
                edition,
                finish: compatibleFinishes.includes(variant.finish)
                  ? variant.finish
                  : concreteFinishes.length === 1 ? concreteFinishes[0] : "unspecified",
                printing: compatiblePrintings.includes(printing) ? printing : compatiblePrintings[0],
              });
            }}
          >
            {!editionValues.includes(variant.edition) ? <option value={variant.edition} disabled>{editionLabels[variant.edition]} · nicht bestätigt</option> : null}
            {editionValues.map((value) => <option value={value} key={value}>{editionLabels[value]}</option>)}
          </select>
        </label>
        <label>
          Druckvariante
          <select
            required
            value={printing}
            onChange={(event) => onVariantChange({ ...variant, printing: event.target.value as NonNullable<VariantSelection["printing"]> })}
          >
            {!printingValues.includes(printing) ? <option value={printing} disabled>{printingLabels[printing]} · nicht bestätigt</option> : null}
            {printingValues.map((value) => <option value={value} key={value}>{printingLabels[value]}</option>)}
          </select>
        </label>
        <label>
          Eigene Variantenbezeichnung {labelRequired ? "(Pflichtfeld)" : "(optional)"}
          <input
            value={variant.label ?? ""}
            maxLength={100}
            required={labelRequired}
            placeholder={labelRequired && variant.edition === "unlimited" ? "z. B. Trainer Deck A" : "z. B. Cosmos Holo"}
            onChange={(event) => onVariantChange({ ...variant, label: event.target.value || undefined })}
          />
        </label>
        <label>
          Mindestzustand
          <select
            value={preferences.minimumCondition}
            onChange={(event) => onPreferencesChange({
              ...preferences,
              minimumCondition: event.target.value as PurchasePreferences["minimumCondition"],
            })}
          >
            {Object.entries(minimumConditionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className={styles.variantHint}>
        {formatAvailableVariants(availability)} {areFinishesVerified(availability)
          ? "Es werden nur bestätigte Standardoptionen angeboten."
          : "Das Finish bleibt manuell; historische Editionen und Druckvarianten werden trotzdem begrenzt."} „Mit Schatten / Standard“ ist vorausgewählt.
      </p>
      {issue ? <p className={styles.warning} role="status">{issue}</p> : null}
    </>
  );
}
