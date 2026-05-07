"use client";

import FleetTable from "@/components/dashboard/fleet-table";
import type { FleetTableProps } from "@/components/dashboard/types";

type Props = FleetTableProps & {
  open: boolean;
  onClose: () => void;
};

export default function FleetTableModal({ open, onClose, ...tableProps }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">Flota filtrada (ampliada)</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Vista a pantalla grande para revisar barcos y puertos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/15 bg-slate-950/40 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
          >
            Cerrar
          </button>
        </div>
        <div className="p-4">
          <FleetTable {...tableProps} />
        </div>
      </div>
    </div>
  );
}

