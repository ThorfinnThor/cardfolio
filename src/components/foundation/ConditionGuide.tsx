import { conditionProfiles } from "@/domain/purchase-preferences";

import styles from "./condition-guide.module.css";

export function ConditionGuide() {
  return (
    <aside className={styles.guide} aria-label="Erklärung der Kartenzustände">
      <p><strong>Unsere Empfehlung für Geschenke:</strong> „Sehr gut“ – kleine Spuren sind okay, ohne unnötig nur die teuersten Angebote zuzulassen.</p>
      <details>
        <summary>Was bedeutet der Kartenzustand?</summary>
        <p>Der Zustand beschreibt sichtbare Abnutzung. Er ist unabhängig von Sprache, Holo-Ausführung und Edition.</p>
        <ul>
          {conditionProfiles.map((profile) => (
            <li key={profile.value}>
              <strong>{profile.shortLabel}</strong>
              <span>{profile.explanation}</span>
              <small>{profile.providerSummary}</small>
            </li>
          ))}
        </ul>
        <p className={styles.caution}>Prüfe bei wertvollen Karten immer die Angebotsfotos und die Zustandsbeschreibung des Verkäufers. „Zustand egal“ kann beschädigte Karten einschließen.</p>
      </details>
    </aside>
  );
}
