import Link from 'next/link'

const LOGO_B64 = 'data:image/png;base64,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'

export default function LandingPage() {
  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] antialiased overflow-x-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-family: 'Material Symbols Outlined'; font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        .font-jakarta { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
      `}</style>

      {/* NavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#f8f9fa]/80 backdrop-blur-md border-b border-[#e1e3e4] transition-all duration-300">
        <div className="flex justify-between items-center px-4 md:px-16 py-4 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="mouFacture Logo" className="w-10 h-10 object-contain rounded-full" src={LOGO_B64} />
            <span className="text-[28px] md:text-[40px] font-black tracking-tight text-[#bc000a]" style={{ fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              mouFacture
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {['#fonctionnalites', '#tarifs', '#temoignages'].map((href, i) => (
              <a key={href} href={href}
                className="text-sm font-semibold text-[#5f5e5e] hover:text-[#bc000a] transition-colors py-2 px-4 hover:bg-[#f3f4f5] rounded-lg">
                {['Fonctionnalités', 'Tarifs', 'Témoignages'][i]}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login"
              className="hidden md:inline-flex text-sm font-semibold text-[#5f5e5e] hover:text-[#bc000a] transition-colors py-2 px-4 hover:bg-[#f3f4f5] rounded-lg">
              Connexion
            </Link>
            <Link href="/auth/register"
              className="inline-flex items-center justify-center bg-[#bc000a] text-white text-sm font-semibold px-5 py-2.5 md:px-6 md:py-3 rounded-full hover:bg-[#e2241f] transition-all shadow-sm active:scale-95">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-[80px] md:pt-[104px]">

        {/* Hero */}
        <section className="relative px-4 md:px-16 py-16 md:py-[120px] max-w-[1440px] mx-auto flex flex-col items-center text-center">
          <h1 className="font-jakarta text-[36px] md:text-[64px] leading-[1.1] font-extrabold tracking-tight max-w-4xl mx-auto mb-6 text-[#191c1d]">
            Dites adieu aux factures sur{' '}
            <span className="text-[#bc000a]">Word et Excel</span>
          </h1>
          <p className="text-[18px] leading-[28px] text-[#5f5e5e] max-w-2xl mx-auto mb-12">
            Le logiciel de facturation moderne conçu pour les entrepreneurs africains. Simple, rapide et conforme.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto justify-center">
            <Link href="/auth/register"
              className="inline-flex items-center justify-center bg-[#1a1c1c] text-white text-sm font-semibold px-8 py-4 rounded-full hover:bg-[#bc000a] transition-all shadow-sm active:scale-95">
              Commencer gratuitement
            </Link>
            <a href="#fonctionnalites"
              className="inline-flex items-center justify-center bg-white text-[#191c1d] border border-[#e7bdb7] text-sm font-semibold px-8 py-4 rounded-full hover:bg-[#f3f4f5] transition-all active:scale-95">
              <span className="material-symbols-outlined mr-2 text-[20px]">play_circle</span>
              Voir les fonctionnalités
            </a>
          </div>

          <div className="w-full max-w-5xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#ffdad5] to-[#ffdad6] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Dashboard mouFacture"
              className="relative rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full object-cover border border-[#e1e3e4]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHvgjskjRq4Ghv3tuHj-HHG3C1qBEM7xBWiDPcpC9fAJaPXSicI_C5uRaAZ7Hp8U8ATNuGVK5bf1PI8XdozgFI2LawoyjUCaX9WKn74wJzahmv6UGDvdWy389WZbhIEDS98Ceno_v1udVR0rmgCINmez3lBV-fyCaEJscScKxZ8yQw4PPx8a1idLE5gx84GccXtRAhJyaWhg632OjoZItxFamZMoelTmx0Md43s6HcPZlm4E9_5PZWJrRuJ6tuX6QMvzOYsF_kI4Y"
            />
          </div>
        </section>

        {/* Problèmes */}
        <section className="px-4 md:px-16 py-20 bg-white max-w-[1440px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-jakarta text-[32px] md:text-[40px] font-bold tracking-tight mb-4">
              Pourquoi perdre du temps avec l&apos;ancien monde ?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: 'description', title: 'Factures peu professionnelles', desc: 'Impacte votre image de marque auprès de vos clients.' },
              { icon: 'calculate', title: 'Calculs de TVA manuels', desc: 'Source d\'erreurs coûteuses et de pertes de temps.' },
              { icon: 'visibility_off', title: 'Suivi impossible', desc: 'Où est passé votre argent ? Difficile à dire avec Excel.' },
            ].map((item) => (
              <div key={item.icon} className="bg-[#f8f9fa] rounded-2xl p-12 border border-[#e1e3e4] flex flex-col items-start hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-full bg-[#ffdad6] flex items-center justify-center mb-6 text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                </div>
                <h3 className="font-jakarta text-[24px] font-semibold mb-2">{item.title}</h3>
                <p className="text-[16px] text-[#5f5e5e]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Fonctionnalités */}
        <section className="px-4 md:px-16 py-20 max-w-[1440px] mx-auto" id="fonctionnalites">
          <div className="text-center mb-16">
            <h2 className="font-jakarta text-[32px] md:text-[40px] font-bold tracking-tight mb-4">
              Tout ce dont vous avez besoin pour facturer comme un pro
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'receipt_long', title: 'Factures en 2 clics', desc: 'Gagnez du temps précieux au quotidien.' },
              { icon: 'percent', title: 'TVA automatique', desc: 'Calculs précis sans effort de votre part.' },
              { icon: 'monitoring', title: 'Suivi en temps réel', desc: 'Sachez exactement qui vous doit quoi.' },
              { icon: 'groups', title: 'Gestion de clients', desc: 'Base de données intégrée et sécurisée.' },
              { icon: 'description', title: 'Devis professionnels', desc: 'Convertissez vos devis en factures en un clic.' },
              { icon: 'picture_as_pdf', title: 'Export PDF natif', desc: 'Téléchargez vos factures en PDF à tout moment.' },
              { icon: 'mail', title: 'Envoi par email', desc: 'Envoyez vos factures directement depuis l\'app.' },
              { icon: 'payments', title: 'Paiements partiels', desc: 'Suivez chaque versement de vos clients.' },
            ].map((item) => (
              <div key={item.icon} className="bg-white rounded-2xl p-6 border border-[#e1e3e4] hover:border-[#bc000a] transition-colors flex flex-col">
                <span className="material-symbols-outlined text-[#bc000a] text-[32px] mb-4">{item.icon}</span>
                <h3 className="font-jakarta text-[20px] font-semibold mb-2">{item.title}</h3>
                <p className="text-[16px] text-[#5f5e5e]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 md:px-16 py-20 max-w-[1440px] mx-auto text-center">
          <div className="bg-[#e2241f] text-white rounded-3xl px-6 py-16 md:py-20">
            <h2 className="font-jakarta text-[32px] md:text-[40px] font-bold tracking-tight mb-6">
              Rejoignez les entrepreneurs qui facturent comme des pros
            </h2>
            <Link href="/auth/register"
              className="inline-flex items-center justify-center bg-white text-[#bc000a] text-sm font-semibold px-8 py-4 rounded-full hover:bg-[#f3f4f5] transition-all shadow-md active:scale-95">
              Commencer gratuitement
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full py-16 bg-white border-t border-[#e1e3e4]">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-16 max-w-[1440px] mx-auto gap-6 md:gap-0">
          <span className="font-jakarta text-[24px] font-black text-[#bc000a]">mouFacture</span>
          <div className="flex flex-wrap justify-center gap-6">
            {['Conditions', 'Confidentialité', 'Contact', 'Aide'].map((label) => (
              <a key={label} href="#"
                className="text-sm font-semibold text-[#5f5e5e] hover:text-[#bc000a] transition-colors hover:underline underline-offset-4">
                {label}
              </a>
            ))}
          </div>
          <p className="text-[16px] text-[#5f5e5e] text-center md:text-right">
            © 2025 mouFacture. Fait avec fierté en Afrique.
          </p>
        </div>
      </footer>

    </div>
  )
}
