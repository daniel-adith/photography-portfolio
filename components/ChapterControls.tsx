"use client";

import React from "react";
import { CONTENT } from "@/content/content";
import styles from "./ChapterControls.module.css";

interface ChapterControlsProps {
  totalChapters: number;
  currentChapter: number;
  chapterNames: string[];
  activeProgress: number; // 0 to 1
  playing: boolean;
  reducedMotion: boolean;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSelectChapter: (index: number) => void;
}

export default function ChapterControls({
  totalChapters,
  currentChapter,
  chapterNames,
  activeProgress,
  playing,
  reducedMotion,
  onPrev,
  onNext,
  onTogglePlay,
  onSelectChapter,
}: ChapterControlsProps) {
  return (
    <div className={styles.container} role="region" aria-label={CONTENT.ui.chapters}>
      {/* 8 Segment Progress Indicators */}
      <div className={styles.segmentsGroup} role="tablist" aria-label={CONTENT.ui.chapters}>
        {Array.from({ length: totalChapters }).map((_, idx) => {
          const isActive = idx === currentChapter;
          const isPast = idx < currentChapter;
          const fillPercent = isActive
            ? `${Math.min(100, Math.max(0, activeProgress * 100))}%`
            : isPast
            ? "100%"
            : "0%";

          return (
            <button
              key={idx}
              type="button"
              className={styles.segmentButton}
              onClick={() => onSelectChapter(idx)}
              aria-label={chapterNames[idx] || `Chapter ${idx + 1}`}
              aria-current={isActive ? "step" : undefined}
            >
              <div className={styles.segmentTrack}>
                <div
                  className={styles.segmentFill}
                  style={{ width: fillPercent }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 3 Nav / Playback Action Buttons */}
      <div className={styles.buttonsGroup}>
        <button
          type="button"
          className={styles.actionButton}
          onClick={onPrev}
          aria-label={CONTENT.ui.prev}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="7.5,2 3.5,6 7.5,10" />
          </svg>
        </button>

        {!reducedMotion && (
          <button
            type="button"
            className={styles.actionButton}
            onClick={onTogglePlay}
            aria-label={playing ? CONTENT.ui.pause : CONTENT.ui.play}
          >
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="2.5" y="2" width="2.5" height="8" />
                <rect x="7" y="2" width="2.5" height="8" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <polygon points="3.5,2 10,6 3.5,10" />
              </svg>
            )}
          </button>
        )}

        <button
          type="button"
          className={styles.actionButton}
          onClick={onNext}
          aria-label={CONTENT.ui.next}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="4.5,2 8.5,6 4.5,10" />
          </svg>
        </button>
      </div>
    </div>
  );
}
