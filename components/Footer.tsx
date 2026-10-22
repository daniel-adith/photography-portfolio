import { CONTENT } from "@/content/content";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer id="site-footer" className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <span>{CONTENT.meta.name}</span>
        <span>{CONTENT.meta.year}</span>
      </div>
    </footer>
  );
}
