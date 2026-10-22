import { CONTENT } from "@/content/content";
import styles from "./Approach.module.css";

export default function Approach() {
  return (
    <section id="approach" className={styles.section} aria-labelledby="approach-title">
      <div className={styles.inner}>
        <div className={styles.headingRow}>
          <h2 id="approach-title" tabIndex={-1} className={styles.title}>
            {CONTENT.approach.title}
          </h2>
          <p className={styles.intro}>{CONTENT.approach.intro}</p>
        </div>

        <div className={styles.rowList}>
          {CONTENT.approach.items.map((item) => (
            <div key={item.no} className={styles.rowItem}>
              <span className={styles.itemNo}>[{item.no}]</span>
              <h3 className={styles.itemName}>{item.name}</h3>
              <p className={styles.itemText}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
