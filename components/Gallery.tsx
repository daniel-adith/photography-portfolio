"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import styles from "./Gallery.module.css";

export interface GalleryPhoto {
  src: string;
  alt: string;
  triggerId?: string;
}

interface LightboxContextType {
  openLightbox: (photo: GalleryPhoto, allPhotos: GalleryPhoto[], triggerEl: HTMLElement | null) => void;
  closeLightbox: () => void;
}

const LightboxContext = createContext<LightboxContextType | null>(null);

export function useLightbox() {
  const context = useContext(LightboxContext);
  if (!context) {
    throw new Error("useLightbox must be used within a GalleryProvider");
  }
  return context;
}

export function GalleryProvider({ children }: { children: React.ReactNode }) {
  const [activePhoto, setActivePhoto] = useState<GalleryPhoto | null>(null);
  const [photoList, setPhotoList] = useState<GalleryPhoto[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  const openLightbox = useCallback(
    (photo: GalleryPhoto, allPhotos: GalleryPhoto[], triggerEl: HTMLElement | null) => {
      triggerRef.current = triggerEl;
      setPhotoList(allPhotos);
      const idx = allPhotos.findIndex((p) => p.src === photo.src);
      setCurrentIndex(idx >= 0 ? idx : 0);
      setActivePhoto(photo);
    },
    []
  );

  const closeLightbox = useCallback(() => {
    setActivePhoto(null);
    if (triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  const goToPrev = useCallback(() => {
    if (photoList.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? photoList.length - 1 : prev - 1));
  }, [photoList]);

  const goToNext = useCallback(() => {
    if (photoList.length <= 1) return;
    setCurrentIndex((prev) => (prev === photoList.length - 1 ? 0 : prev + 1));
  }, [photoList]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!activePhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePhoto, closeLightbox, goToPrev, goToNext]);

  const currentDisplayPhoto = photoList[currentIndex] ?? activePhoto;

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      {activePhoto && currentDisplayPhoto && (
        <div
          className={styles.lightboxOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Penampil foto layar penuh"
        >
          <div className={styles.lightboxControls}>
            <button
              type="button"
              className={styles.controlButton}
              onClick={closeLightbox}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>

          {photoList.length > 1 && (
            <>
              <button
                type="button"
                className={styles.prevButton}
                onClick={goToPrev}
                aria-label="Foto sebelumnya"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.nextButton}
                onClick={goToNext}
                aria-label="Foto berikutnya"
              >
                →
              </button>
              <div className={styles.lightboxCounter}>
                {currentIndex + 1} / {photoList.length}
              </div>
            </>
          )}

          <div className={styles.lightboxImageWrapper}>
            <Image
              src={currentDisplayPhoto.src}
              alt={currentDisplayPhoto.alt}
              fill
              className={styles.lightboxImage}
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </LightboxContext.Provider>
  );
}

interface PhotoFrameProps {
  slug: string;
  n: number;
  alt: string;
  photoUrl: string | null;
  aspectRatio?: string;
  allPhotos?: GalleryPhoto[];
  className?: string;
}

export function PhotoFrame({
  n,
  alt,
  photoUrl,
  aspectRatio = "4 / 5",
  allPhotos = [],
  className,
}: PhotoFrameProps) {
  const lightbox = useContext(LightboxContext);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const formattedNumber = String(n).padStart(2, "0");

  if (!photoUrl) {
    return (
      <div
        className={`${styles.frame} ${className ?? ""}`}
        style={{ aspectRatio }}
      >
        <div className={styles.placeholder}>
          <span className={styles.placeholderNumber}>[{formattedNumber}]</span>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    if (lightbox) {
      const photos = allPhotos.length > 0 ? allPhotos : [{ src: photoUrl, alt }];
      lightbox.openLightbox({ src: photoUrl, alt }, photos, buttonRef.current);
    }
  };

  return (
    <div
      className={`${styles.frame} ${className ?? ""}`}
      style={{ aspectRatio }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={styles.frameButton}
        onClick={handleClick}
        aria-label={alt}
      >
        <Image
          src={photoUrl}
          alt={alt}
          fill
          className={styles.image}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </button>
    </div>
  );
}

export default function Gallery({ children }: { children?: React.ReactNode }) {
  return <GalleryProvider>{children}</GalleryProvider>;
}
