import { CONTENT } from "@/content/content";
import styles from "./Works.module.css";

export default function Works() {
  return (
    <section id="works" className={styles.section} aria-labelledby="works-title">
      <div className={styles.inner}>
        <p className={styles.question}>{CONTENT.works.question}</p>
        <h2 id="works-title" tabIndex={-1} className={styles.title}>
          {CONTENT.works.title}
        </h2>
      </div>
    </section>
  );
}
