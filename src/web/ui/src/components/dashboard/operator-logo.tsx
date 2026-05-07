"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  /** Nombre de fichero sin extensión (p. ej. fred-olsen-express), coincide con public/operators/ */
  logoSlug: string;
  label?: string;
  className?: string;
};

/**
 * Intenta cargar un logo desde public/operators/{slug}.png o .svg.
 * Si no existe, no renderiza nada.
 */
export default function OperatorLogo({ logoSlug, label, className = "h-5 w-5" }: Props) {
  const [hidden, setHidden] = useState(false);
  const [format, setFormat] = useState<"png" | "svg">("png");

  if (hidden || !logoSlug) return null;

  const src = format === "png" ? `/operators/${logoSlug}.png` : `/operators/${logoSlug}.svg`;

  return (
    <Image
      src={src}
      alt={label ? `${label} (logo)` : ""}
      width={64}
      height={64}
      unoptimized
      className={`${className} rounded-sm object-contain`}
      onError={() => {
        if (format === "png") setFormat("svg");
        else setHidden(true);
      }}
    />
  );
}
