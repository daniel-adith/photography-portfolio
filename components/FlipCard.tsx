"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import styles from "./FlipCard.module.css";

interface FlipCardProps {
  n: number;
  slug: string;
  alt: string;
  photoUrl: string | null;
  isFlipped: boolean;
  durationMs: number;
  delayMs: number;
  shouldLoadImage: boolean;
  reducedMotion: boolean;
  onCardClick?: () => void;
}

export default function FlipCard({
  n,
  alt,
  photoUrl,
  isFlipped,
  durationMs,
  delayMs,
  shouldLoadImage,
  reducedMotion,
  onCardClick,
}: FlipCardProps) {
  const formattedNumber = String(n).padStart(2, "0");
  const isClickable = Boolean(isFlipped && photoUrl && onCardClick);

  return (
    <div
      className={`${styles.card} ${isClickable ? styles.cardInteractive : ""}`}
      onClick={() => {
        if (isClickable && onCardClick) {
          onCardClick();
        }
      }}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : -1}
      aria-label={isClickable ? alt : undefined}
      onKeyDown={(e) => {
        if (isClickable && onCardClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onCardClick();
        }
      }}
    >
      <motion.div
        className={styles.cardInner}
        initial={{ rotateY: reducedMotion ? 0 : 180 }}
        animate={{ rotateY: reducedMotion || isFlipped ? 0 : 180 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                duration: durationMs / 1000,
                delay: delayMs / 1000,
                ease: [0.2, 0.7, 0.1, 1],
              }
        }
      >
        {/* Front Face (0deg) */}
        <div className={`${styles.face} ${styles.frontFace}`}>
          {shouldLoadImage && photoUrl ? (
            <Image
              src={photoUrl}
              alt={alt}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className={styles.image}
              priority={false}
            />
          ) : (
            <span className={styles.frontFallbackNumber}>[{formattedNumber}]</span>
          )}
        </div>

        {/* Back Face (180deg) */}
        <div className={`${styles.face} ${styles.backFace}`}>
          <span className={styles.backLabel}>[{formattedNumber}]</span>
        </div>
      </motion.div>
    </div>
  );
}
