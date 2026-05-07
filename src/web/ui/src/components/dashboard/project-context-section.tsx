export default function ProjectContextSection() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-white">Contexto del proyecto</h2>
      <p className="mt-2 text-sm text-slate-300">
        Esta capa web consume métricas ya procesadas en InfluxDB y las convierte en una vista
        operativa. El flujo completo es: ingestión AIS en tiempo real, publicación en Kafka,
        procesamiento en Spark Structured Streaming, enriquecimiento geográfico y exposición en UI.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Implementado</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Ingestión AIS (WebSocket) → Kafka.</li>
            <li>Procesamiento streaming en Spark: normalización, geofence y puerto más cercano.</li>
            <li>Persistencia en InfluxDB Cloud y API web (`/api/metrics`).</li>
            <li>Dashboard en vivo: KPIs, mapa, filtros, ranking de puertos y top velocidad.</li>
          </ul>
        </article>

        <article className="rounded-xl border border-white/10 bg-slate-900/45 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Mejoras futuras (no incluidas)</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Histórico por buque (trayectorias por ventanas mayores).</li>
            <li>Alertas de negocio (amarre/inactividad prolongada, geofencing por zonas).</li>
            <li>Separación de roles/autenticación si se abre a usuarios.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
