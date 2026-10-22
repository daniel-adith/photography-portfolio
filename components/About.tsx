import { CONTENT } from "@/content/content";
import styles from "./About.module.css";

export default function About() {
  return (
    <section id="about" className={styles.section} aria-labelledby="about-title">
      <div className={styles.inner}>
        <div className={styles.titleColumn}>
          <h2 id="about-title" tabIndex={-1} className={styles.title}>
            {CONTENT.about.title}
          </h2>
        </div>
        <div className={styles.textColumn}>
          {CONTENT.about.paragraphs.map((p, idx) => (
            <p key={idx} className={styles.paragraph}>
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
