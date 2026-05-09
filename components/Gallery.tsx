"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  function move(step: number) {
    setIndex((value) => (value + step + images.length) % images.length);
  }

  return (
    <div>
      {images.length > 1 ? (
        <>
          <button className="nav-arrow left" onClick={() => move(-1)} aria-label="Previous image">
            <ChevronLeft size={32} strokeWidth={3} />
          </button>
          <button className="nav-arrow right" onClick={() => move(1)} aria-label="Next image">
            <ChevronRight size={32} strokeWidth={3} />
          </button>
        </>
      ) : null}
      <div className="detail-image-wrap">
        <Image className="detail-image" src={current} alt={name} width={900} height={900} priority />
      </div>
      <div className="dots" aria-label="Gallery position">
        {images.map((image, dotIndex) => (
          <span className={`dot ${dotIndex === index ? "active" : ""}`} key={`${image}-${dotIndex}`} />
        ))}
      </div>
    </div>
  );
}
