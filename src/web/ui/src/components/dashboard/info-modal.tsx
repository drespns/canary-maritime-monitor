"use client";

import { useEffect } from "react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function InfoModal({ open, title, subtitle, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <button
        aria-label="Cerrar modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
      />
      <section
        className={`relative z-10 max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl transition-all duration-200 ${
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <header className="border-b border-white/10 bg-slate-900/70 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
            >
              Cerrar
            </button>
          </div>
        </header>
        <div className="max-h-[calc(85vh-78px)] overflow-y-auto px-5 py-4">{children}</div>
      </section>
    </div>
  );
}

