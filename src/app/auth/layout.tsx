const features = [
  'Créez des factures professionnelles en quelques secondes',
  'Suivez vos paiements et relancez vos clients facilement',
  'Tableau de bord complet pour piloter votre activité',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@700;800&display=swap');
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 text-white relative overflow-hidden select-none" style={{ background: 'linear-gradient(135deg, #1a1c1c 0%, #bc000a 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="text-xl font-black leading-none">M</span>
          </div>
          <span className="font-jakarta text-2xl font-black tracking-tight">mouFacture</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-jakarta text-4xl font-extrabold leading-tight">
              La facturation<br />pensée pour<br />l&apos;Afrique
            </h2>
            <p className="mt-4 text-white/70 text-sm">
              Optimisé pour le Franc CFA · XOF &amp; XAF
            </p>
          </div>

          <div className="space-y-4">
            {features.map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} mouFacture · Fait avec ❤️ pour les PME africaines
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f8f9fa] p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: '#bc000a' }}>
              <span className="text-sm font-black">M</span>
            </div>
            <span className="font-jakarta text-xl font-black" style={{ color: '#bc000a' }}>mouFacture</span>
          </div>
          <p className="text-sm text-[#5f5e5e]">Gestion de facturation simplifiée</p>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
