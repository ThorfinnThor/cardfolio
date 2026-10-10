import type { CardVariantAvailability, PurchasePreferences, VariantSelection } from "@/domain/types";
import { conditionProfile, conditionProfiles } from "@/domain/purchase-preferences";
import {
  areFinishesVerified,
  availableEditionValues,
  availableFinishValues,
  availablePrintingValues,
  editionLabels,
  formatAvailableVariants,
  printingLabels,
  requiresVariantLabel,
  selectedPrinting,
  variantSelectionIssue,
  type CardVariantOptions,
} from "@/domain/variant-selection";

import { ConditionGuide } from "./ConditionGuide";
import styles from "./foundation-workspace.module.css";

interface VariantFieldsProps {
  variant: VariantSelection;
  preferences: PurchasePreferences;
  availability?: CardVariantAvailability | CardVariantOptions;
  explainCondition?: boolean;
  onVariantChange: (variant: VariantSelection) => void;
  onPreferencesChange: (preferences: PurchasePreferences) => void;
}

const beginnerFinishLabels: Record<VariantSelection["finish"], string> = {
  normal: "Normal – nicht glänzend",
  holo: "Holo – Bildbereich glänzt",
  reverse: "Reverse Holo – übrige Karte glänzt",
  other: "Andere Sonderausgabe",
  unspecified: "Bitte Ausführung auswählen",
};

export function VariantFields({
  variant,
  preferences,
  availability,
  explainCondition = false,
  onVariantChange,
  onPreferencesChange,
}: VariantFieldsProps) {
  const finishValues = availableFinishValues(availability, variant.edition);
  const editionValues = availableEditionValues(availability);
  const printingValues = availablePrintingValues(availability, variant.edition);
  const printing = selectedPrinting(variant);
  const issue = variantSelectionIssue(variant, availability);
  const labelRequired = requiresVariantLabel(variant, availability);
  const currentCondition = conditionProfile(preferences.minimumCondition);
  const showAdvancedByDefault = variant.edition !== "unlimited"
    || printing !== "shadowed"
    || Boolean(variant.label?.trim())
    || labelRequired;

  return (
    <>
      <div className={styles.variantStatus} data-complete={!issue} role="status">
        <strong>{issue ? "Noch eine Angabe offen" : "Für die Bestellung vorbereitet"}</strong>
        <span>{issue ?? "Ausführung und gewünschter Zustand sind vollständig festgelegt."}</span>
      </div>
      <div className={styles.variantForm}>
        <label>
          Ausführung der Karte
          <select
            aria-label="Ausführung der Karte"
            required
            value={variant.finish}
            onChange={(event) => onVariantChange({ ...variant, finish: event.target.value as VariantSelection["finish"] })}
          >
            {!finishValues.includes(variant.finish) ? <option value={variant.finish} disabled>{beginnerFinishLabels[variant.finish]} · nicht bestätigt</option> : null}
            {finishValues.map((value) => <option value={value} key={value}>{beginnerFinishLabels[value]}</option>)}
          </select>
          <small>Wähle, welcher Teil der Karte glänzen soll. Wenn du unsicher bist, vergleiche das Kartenbild beim Anbieter.</small>
        </label>
        <label>
          Mindestzustand beim Kauf
          <select
            aria-label="Mindestzustand beim Kauf"
            value={preferences.minimumCondition}
            onChange={(event) => onPreferencesChange({
              ...preferences,
              minimumCondition: event.target.value as PurchasePreferences["minimumCondition"],
            })}
          >
            {conditionProfiles.map((profile) => <option value={profile.value} key={profile.value}>{profile.label}</option>)}
          </select>
          <small>{currentCondition.providerSummary}</small>
        </label>
        {explainCondition ? <ConditionGuide /> : null}
        <details className={styles.variantAdvanced} open={showAdvancedByDefault || undefined}>
          <summary>Sonderausgaben und Druckdetails</summary>
          <p>Nur ändern, wenn ausdrücklich First Edition, Shadowless oder eine besondere Druckausgabe gewünscht ist.</p>
          <div>
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
          </div>
        </details>
      </div>
      <p className={styles.variantHint}>
        {formatAvailableVariants(availability)} {areFinishesVerified(availability)
          ? "Es werden nur bestätigte Standardoptionen angeboten."
          : "Das Finish bleibt manuell; historische Editionen und Druckvarianten werden trotzdem begrenzt."} „Mit Schatten / Standard“ ist vorausgewählt.
      </p>
    </>
  );
}
