"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
}

const CENTER_ORIGIN = "50% 50%";

/**
 * Product image gallery: a hover-to-zoom main image, a scrollable clickable
 * thumbnail strip, and a full-screen lightbox (prev/next, keyboard, tap-zoom).
 * Falls back to a neutral placeholder when the product has no images.
 */
export function ProductGallery({
  images,
  alt,
}: ProductGalleryProps): React.JSX.Element {
  const [active, setActive] = React.useState(0);
  const [origin, setOrigin] = React.useState(CENTER_ORIGIN);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const stripRef = React.useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const hasImages = images.length > 0;
  const multiple = images.length > 1;
  const safeActive = Math.min(active, Math.max(0, images.length - 1));

  const updateArrows = React.useCallback((): void => {
    const el = stripRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, images.length]);

  function handleZoomMove(e: React.MouseEvent<HTMLElement>): void {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  function scrollStrip(dir: -1 | 1): void {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  // No images → keep the neutral placeholder used elsewhere in the catalog.
  if (!hasImages) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-card border border-gray-200 bg-gradient-to-br from-[#f4f4f6] to-[#e6e7ec]">
        <div className="h-[52%] w-[52%] rounded-[18px] bg-[repeating-linear-gradient(45deg,#e4e5e9,#e4e5e9_12px,#eeeef1_12px,#eeeef1_24px)]" />
      </div>
    );
  }

  return (
    <div>
      {/* Main image — hover to magnify, click to open the lightbox. */}
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        onMouseMove={handleZoomMove}
        onMouseLeave={() => setOrigin(CENTER_ORIGIN)}
        aria-label="Perbesar gambar"
        className="group relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-card border border-gray-200 bg-gradient-to-br from-[#f4f4f6] to-[#e6e7ec]"
      >
        <Image
          src={images[safeActive]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1820px) 100vw, 600px"
          style={{ transformOrigin: origin }}
          className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.75]"
        />
        <span className="pointer-events-none absolute top-3 right-3 flex items-center gap-1 rounded-pill bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
          <ZoomIn className="h-3.5 w-3.5" />
          Perbesar
        </span>
      </button>

      {/* Thumbnail strip */}
      {multiple && (
        <div className="relative mt-3.5">
          {canLeft && (
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              aria-label="Geser ke kiri"
              className="absolute top-1/2 left-0 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-ink shadow-menu backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={stripRef}
            onScroll={updateArrows}
            className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth"
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-label={`Lihat gambar ${i + 1}`}
                aria-pressed={i === safeActive}
                className={cn(
                  "relative aspect-square w-[68px] flex-none overflow-hidden rounded-[12px] border-2 bg-gradient-to-br from-[#f4f4f6] to-[#e9eaee] transition-colors sm:w-[76px]",
                  i === safeActive
                    ? "border-brand"
                    : "border-gray-200 hover:border-border-strong",
                )}
              >
                <Image
                  src={src}
                  alt={`${alt} — foto ${i + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {canRight && (
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              aria-label="Geser ke kanan"
              className="absolute top-1/2 right-0 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-ink shadow-menu backdrop-blur transition-colors hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {lightboxOpen && (
        <GalleryLightbox
          images={images}
          alt={alt}
          index={safeActive}
          onIndexChange={setActive}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

interface GalleryLightboxProps {
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

/** Full-screen image viewer with prev/next, keyboard nav, and tap-to-zoom. */
function GalleryLightbox({
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: GalleryLightboxProps): React.ReactNode {
  const [mounted, setMounted] = React.useState(false);
  const [zoomed, setZoomed] = React.useState(false);
  const [origin, setOrigin] = React.useState(CENTER_ORIGIN);

  const multiple = images.length > 1;

  const go = React.useCallback(
    (dir: -1 | 1): void => {
      setZoomed(false);
      onIndexChange((index + dir + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [go, onClose]);

  function handleZoomMove(e: React.MouseEvent<HTMLElement>): void {
    if (!zoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex animate-[rmx-fade_.2s_ease] flex-col bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label={`Galeri ${alt}`}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="rounded-pill bg-white/10 px-3 py-1 text-[12px] font-medium text-white tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-16">
        {multiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            aria-label="Gambar sebelumnya"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          onMouseMove={handleZoomMove}
          onMouseLeave={() => setOrigin(CENTER_ORIGIN)}
          className={cn(
            "relative h-full max-h-full w-full max-w-[920px]",
            zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
          )}
        >
          <Image
            src={images[index]}
            alt={`${alt} — foto ${index + 1}`}
            fill
            quality={90}
            sizes="(max-width: 640px) 100vw, 920px"
            style={zoomed ? { transformOrigin: origin } : undefined}
            className={cn(
              "object-contain transition-transform duration-200 ease-out",
              zoomed && "scale-[2.2]",
            )}
          />
        </div>

        {multiple && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            aria-label="Gambar berikutnya"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {multiple && (
        <div
          className="no-scrollbar flex justify-start gap-2 overflow-x-auto px-4 py-4 sm:justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => {
                setZoomed(false);
                onIndexChange(i);
              }}
              aria-label={`Lihat gambar ${i + 1}`}
              aria-pressed={i === index}
              className={cn(
                "relative aspect-square w-14 flex-none overflow-hidden rounded-[10px] border-2 transition-colors",
                i === index
                  ? "border-white"
                  : "border-white/25 hover:border-white/60",
              )}
            >
              <Image
                src={src}
                alt={`${alt} — thumbnail ${i + 1}`}
                fill
                sizes="60px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}
