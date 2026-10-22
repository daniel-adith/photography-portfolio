import { CONTENT } from "@/content/content";
import styles from "./Contact.module.css";

export default function Contact() {
  return (
    <section id="contact" className={styles.section} aria-labelledby="contact-title">
      <div className={styles.inner}>
        <div className={styles.mainContent}>
          <h2 id="contact-title" tabIndex={-1} className={styles.title}>
            {CONTENT.contact.title}
          </h2>
          <p className={styles.cta}>{CONTENT.contact.cta}</p>

          <div className={styles.channelList}>
            {CONTENT.contact.channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.channelRow}
              >
                <span className={styles.channelLabel}>{channel.label}</span>
                <span className={styles.channelText}>{channel.text}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Footer satu baris di dasar scene */}
        <footer id="site-footer" className={styles.footer} role="contentinfo">
          <span>{CONTENT.meta.name}</span>
          <span>{CONTENT.meta.year}</span>
        </footer>
      </div>
    </section>
  );
}
