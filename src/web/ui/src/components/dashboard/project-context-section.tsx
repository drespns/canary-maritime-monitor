export default function ProjectContextSection() {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/45 p-5 backdrop-blur-sm">
      <h2 className="text-lg font-semibold text-white">Contexto del proyecto: lo hecho y lo pendiente</h2>
      <p className="mt-2 text-sm text-slate-300">
        Esta capa web consume métricas ya procesadas en InfluxDB y las convierte en una vista
        operativa. El flujo completo es: ingestión AIS en tiempo real, publicación en Kafka,
        procesamiento en Spark Structured Streaming, enriquecimiento geográfico y exposición en UI.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Ya implementado</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Infra Docker con Kafka KRaft, InfluxDB y Grafana.</li>
            <li>Ingestión AIS con reconexión automática y trazas de recepción.</li>
            <li>Procesamiento Spark con normalización, geofencing y puerto más cercano (Haversine).</li>
            <li>Persistencia de micro-batches en InfluxDB y smoke test de verificación.</li>
            <li>Dashboard web live con polling, mapa interactivo, filtros y panel lateral.</li>
          </ul>
        </article>

        <article className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-200">Siguiente iteración recomendada</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            <li>Histórico temporal por buque para mostrar trayectorias y no solo snapshots.</li>
            <li>Alertas de negocio: entrada/salida de zona, amarre, inactividad prolongada.</li>
            <li>Autenticación y roles para separar vistas operativas y analíticas.</li>
            <li>Testing E2E del flujo completo (producer → spark → influx → api → ui).</li>
            <li>Observabilidad: métricas de latencia por etapa y alarmas en Grafana.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
