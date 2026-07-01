'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryImage {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface Props {
  images: GalleryImage[];
  productName: string;
  isFeatured: boolean;
}

export default function ProductImageGallery({ images, productName, isFeatured }: Props) {
  const primaryIdx = images.findIndex((i) => i.isPrimary);
  const [activeIdx, setActiveIdx] = useState(primaryIdx >= 0 ? primaryIdx : 0);

  const active = images[activeIdx];

  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/50 shadow-md ring-1 ring-border/60">
        {active ? (
          <Image
            src={active.url}
            alt={active.alt || productName}
            fill
            className="object-cover transition-opacity duration-200"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-20 h-20 text-muted-foreground/10" />
          </div>
        )}

        {isFeatured && (
          <span className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-gold text-gold-foreground text-xs font-bold flex items-center gap-1.5 shadow-md">
            <Star className="w-3.5 h-3.5" fill="currentColor" />Featured
          </span>
        )}

        {/* Prev/Next arrows — only show when >1 image */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative aspect-square w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                i === activeIdx
                  ? 'border-primary shadow-sm ring-2 ring-primary/20'
                  : 'border-border/50 hover:border-primary/40 opacity-70 hover:opacity-100'
              }`}
            >
              <Image src={img.url} alt={img.alt || `${productName} image ${i + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
