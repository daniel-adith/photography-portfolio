"use client";

import React from "react";
import { CONTENT } from "@/content/content";
import { useStage } from "./Stage";
import styles from "./Hero.module.css";

export default function Hero() {
  const lineClasses = [styles.line1, styles.line2];
  const { goToScene } = useStage();

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    goToScene(5); // contact is index 5
  };

  return (
    <section className={styles.hero} aria-label="Hero">
      {/* Warm ambient bloom light in bottom-right corner */}
      <div className={styles.warmBloom} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.titleColumn}>
          <h1 className={styles.title}>
            {CONTENT.hero.lines.map((line, idx) => {
              const isLast = idx === CONTENT.hero.lines.length - 1;
              return (
                <span key={idx} className={styles.lineWrapper}>
                  <span className={`${styles.lineSpan} ${lineClasses[idx] ?? ""}`}>
                    {line}
                    {isLast && (
                      <span className={styles.mark} aria-label={`Tahun ${CONTENT.hero.mark}`}>
                        {CONTENT.hero.mark}
                      </span>
                    )}
                  </span>
                </span>
              );
            })}
          </h1>
        </div>

        <div className={styles.sideColumn}>
          <p className={styles.support}>{CONTENT.hero.support}</p>
          <div className={styles.ctaWrapper}>
            <a
              href={`#${CONTENT.hero.cta.target}`}
              onClick={handleCtaClick}
              className={styles.ctaLink}
            >
              <span>{CONTENT.hero.cta.label}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
