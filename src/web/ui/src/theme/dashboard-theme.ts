export const dashboardTheme = {
  layout: {
    page: "min-h-screen w-full bg-[linear-gradient(170deg,#020617_0%,#020617_65%,#0b1325_100%)] text-slate-100",
    container: "relative z-10 mx-auto flex w-full max-w-[1920px] flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8",
    bubbleLayer: "pointer-events-none fixed inset-0 -z-0 overflow-hidden",
    bubblePrimary: "absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl",
    bubbleSecondary: "absolute right-0 top-1/3 h-72 w-72 rounded-full bg-violet-500/5 blur-3xl",
  },
  card: {
    base: "rounded-2xl border border-white/10 bg-slate-900/45 backdrop-blur-sm",
    elevated: "rounded-2xl border border-white/10 bg-slate-900/45 shadow-lg backdrop-blur-sm",
    cta: "rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-100 transition hover:bg-cyan-500/20",
  },
  text: {
    title: "text-white",
    muted: "text-slate-400",
    accent: "text-cyan-200",
  },
} as const;

