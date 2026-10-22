import styles from "./variant-glossary.module.css";

const TERMS: ReadonlyArray<{ term: string; text: string }> = [
  { term: "Normal", text: "Die Karte glitzert nicht. Das ist die häufigste Ausführung und meist die günstigste." },
  { term: "Holo", text: "Das Bild in der Mitte glitzert, Rahmen und Text nicht. Holo-Karten kosten meist mehr als normale." },
  { term: "Reverse Holo", text: "Der Rahmen und der Text glitzern, das Bild nicht. Es ist eine zusätzliche Ausführung neben der normalen Karte." },
  { term: "1. Edition", text: "Ein kleiner schwarzer Stempel „1“ links unter dem Bild. Nur die allerersten Drucke alter Sets haben ihn; sie sind oft viel teurer." },
  { term: "Ohne Stempel (Unlimited)", text: "Die spätere, normale Auflage derselben Karte. Sie sieht fast gleich aus, hat aber keinen Stempel und ist günstiger." },
  { term: "Shadowless", text: "Eine frühe Auflage des Grundsets: Rechts am Bildrand fehlt der dünne Schatten. Selten und teuer." },
];

/** A short, folded glossary so beginners and children can tell the variants apart on the card itself. */
export function VariantGlossary() {
  return (
    <details className={styles.glossary}>
      <summary>Was bedeuten Holo, Reverse Holo und 1. Edition?</summary>
      <dl>
        {TERMS.map(({ term, text }) => <div key={term}><dt>{term}</dt><dd>{text}</dd></div>)}
      </dl>
      <p>Im Zweifel nimm die Ausführung, die auf dem Bild zu sehen ist. Das Kartenbild zeigt dir, was du bekommst.</p>
    </details>
  );
}
