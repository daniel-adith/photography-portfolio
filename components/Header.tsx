"use client";

import React from "react";
import { CONTENT } from "@/content/content";
import { useStage, SCENE_IDS, SceneId } from "./Stage";
import styles from "./Header.module.css";

export default function Header() {
  const { currentSceneId, goToScene } = useStage();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const targetIdx = SCENE_IDS.indexOf(id as SceneId);
    if (targetIdx >= 0) {
      goToScene(targetIdx);
    }
  };

  return (
    <header id="site-header" className={styles.header} role="banner">
      <div className={styles.inner}>
        <nav className={styles.nav} aria-label="Main Navigation">
          {CONTENT.nav.map((item) => {
            const isCurrent = currentSceneId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleNavClick(e, item.id)}
                className={`${styles.navLink} ${isCurrent ? styles.navLinkActive : ""}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
