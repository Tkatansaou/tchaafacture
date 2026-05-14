import { CheckCircle2 } from 'lucide-react'

const features = [
  'Créez des factures professionnelles en quelques secondes',
  'Suivez vos paiements et relancez vos clients facilement',
  'Tableau de bord complet pour piloter votre activité',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white relative overflow-hidden select-none">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-white/5" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-8 -translate-y-1/2 w-64 h-64 rounded-full bg-white/[0.03]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="text-lg font-black leading-none">M</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">mouFacture</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold leading-tight">
              La facturation<br />pensée pour<br />l&apos;Afrique
            </h2>
            <p className="mt-3 text-blue-200 text-sm">
              Optimisé pour le Franc CFA · XOF &amp; XAF
            </p>
          </div>

          <div className="space-y-3">
            {features.map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-blue-100 leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-blue-400">
            © {new Date().getFullYear()} mouFacture · Fait avec ❤️ pour les PME africaines
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-sm font-black">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">mouFacture</span>
          </div>
          <p className="text-sm text-muted-foreground">Gestion de facturation simplifiée</p>
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
