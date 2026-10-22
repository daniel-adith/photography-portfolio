"use client";

import React, { useEffect, useCallback } from "react";
import Image from "next/image";
import { CONTENT } from "@/content/content";
import styles from "./Lightbox.module.css";

export interface LightboxPhoto {
  src: string;
  alt: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  currentIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onIndexChange,
}: LightboxProps) {
  const currentPhoto = photos[currentIndex];

  const handlePrev = useCallback(() => {
    if (photos.length <= 1) return;
    onIndexChange(currentIndex === 0 ? photos.length - 1 : currentIndex - 1);
  }, [photos.length, currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (photos.length <= 1) return;
    onIndexChange(currentIndex === photos.length - 1 ? 0 : currentIndex + 1);
  }, [photos.length, currentIndex, onIndexChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  if (!currentPhoto) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Penampil foto layar penuh"
    >
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          onClick={onClose}
          aria-label={CONTENT.ui.lightboxClose}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="1" y1="1" x2="13" y2="13" />
            <line x1="13" y1="1" x2="1" y2="13" />
          </svg>
        </button>
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            className={styles.prevButton}
            onClick={handlePrev}
            aria-label={CONTENT.ui.lightboxPrev}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="8,1 3,6 8,11" />
            </svg>
          </button>
          <button
            type="button"
            className={styles.nextButton}
            onClick={handleNext}
            aria-label={CONTENT.ui.lightboxNext}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="4,1 9,6 4,11" />
            </svg>
          </button>
        </>
      )}

      <div className={styles.imageWrapper}>
        <Image
          src={currentPhoto.src}
          alt={currentPhoto.alt}
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1400px"
          className={styles.image}
        />
      </div>

      {photos.length > 1 && (
        <div className={styles.counter}>
          [ {String(currentIndex + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")} ]
        </div>
      )}
    </div>
  );
}
