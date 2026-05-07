"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import InfoModal from "@/components/dashboard/info-modal";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ReadmePreviewModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"summary" | "architecture" | "runbook" | "full">(
    "summary"
  );
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || markdown) return;

    const fetchReadme = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/readme", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { markdown?: string };
        setMarkdown(data.markdown ?? "");
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "unknown");
      } finally {
        setLoading(false);
      }
    };

    void fetchReadme();
  }, [open, markdown]);

  const section = (title: string) => {
    if (!markdown) return "";
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rgx = new RegExp(`##\\s+${escaped}[\\s\\S]*?(?=\\n##\\s+|$)`, "i");
    const match = markdown.match(rgx);
    return match ? match[0] : "";
  };

  const summaryMarkdown = `## Resumen rápido

- Pipeline en tiempo real AIS -> Kafka -> Spark -> InfluxDB -> Web/Grafana.
- Enriquecimiento geográfico en Spark con puerto más cercano (Haversine).
- Dashboard live con mapa, filtros, KPIs, panel lateral y glosario.
- Infra dockerizada con perfiles para Spark y web.
`;

  const architectureMarkdown = section("Arquitectura resumida");
  const runbookMarkdown = `${section("Arranque rápido (Windows / PowerShell)")}\n\n${section("Quality checks")}`;

  const markdownByTab: Record<"summary" | "architecture" | "runbook" | "full", string> = {
    summary: summaryMarkdown,
    architecture: architectureMarkdown || "Sección no encontrada en README.",
    runbook: runbookMarkdown.trim() || "Sección no encontrada en README.",
    full: markdown,
  };

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title="README del proyecto"
      subtitle="Vista rápida del documento raíz para onboarding técnico"
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { id: "summary", label: "Resumen" },
          { id: "architecture", label: "Arquitectura" },
          { id: "runbook", label: "Runbook" },
          { id: "full", label: "README completo" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`rounded-md border px-2.5 py-1 text-xs ${
              activeTab === tab.id
                ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                : "border-white/15 text-slate-300 hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-slate-400">Cargando README...</p> : null}
      {error ? (
        <p className="rounded-lg border border-amber-400/30 bg-amber-950/25 px-3 py-2 text-sm text-amber-200">
          Error cargando README: {error}
        </p>
      ) : null}
      {!loading && !error ? (
        <article className="space-y-3 text-sm text-slate-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="mt-2 text-2xl font-bold text-white">{children}</h1>,
              h2: ({ children }) => <h2 className="mt-6 text-xl font-semibold text-cyan-200">{children}</h2>,
              h3: ({ children }) => <h3 className="mt-4 text-lg font-semibold text-cyan-100">{children}</h3>,
              p: ({ children }) => <p className="leading-relaxed text-slate-300">{children}</p>,
              li: ({ children }) => <li className="ml-5 list-disc py-0.5 text-slate-300">{children}</li>,
              code: ({ children }) => (
                <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-cyan-100">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/80 p-3 text-xs">
                  {children}
                </pre>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-cyan-300 underline decoration-cyan-500/50">
                  {children}
                </a>
              ),
            }}
          >
            {markdownByTab[activeTab]}
          </ReactMarkdown>
        </article>
      ) : null}
    </InfoModal>
  );
}

