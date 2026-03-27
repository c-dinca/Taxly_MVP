import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'

const FEATURES = [
  {
    icon: '📄',
    title: 'Facturare rapidă',
    desc: 'Creează și trimite facturi profesionale în câteva secunde',
  },
  {
    icon: '🧮',
    title: 'Calculator fiscal',
    desc: 'CAS, CASS și impozit calculat automat în timp real',
  },
  {
    icon: '🏦',
    title: 'Curs BNR live',
    desc: 'Facturile în EUR/USD convertite automat la cursul zilei',
  },
  {
    icon: '📊',
    title: 'Dashboard inteligent',
    desc: 'Vizualizează veniturile, cheltuielile și TVA-ul dintr-o privire',
  },
  {
    icon: '📤',
    title: 'e-Factura ANAF',
    desc: 'Transmitere automată în sistemul național e-Factura',
  },
  {
    icon: '📱',
    title: 'Funcționează offline',
    desc: 'Acces la date chiar și fără internet, pe orice dispozitiv',
  },
]

function TaxlyLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 10 : size === 'sm' ? 7 : 8
  const iconSize = size === 'lg' ? 22 : size === 'sm' ? 14 : 18
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-${dim} w-${dim} items-center justify-center rounded-xl bg-[#004AAD] shrink-0`}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="19" cy="18" r="3" fill="#F79A36" />
        </svg>
      </div>
      <span
        className={`font-bold tracking-tight text-white ${
          size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-[17px]'
        }`}
      >
        Taxly
      </span>
    </div>
  )
}

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-[#002B67]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <TaxlyLogo />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              Autentifică-te
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-[#F79A36] text-white hover:bg-[#e8871f] transition-colors shadow-sm"
            >
              Începe gratuit
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section
        style={{ background: 'linear-gradient(135deg, #002B67 0%, #004AAD 60%, #1a72c7 100%)' }}
        className="relative overflow-hidden"
      >
        {/* Decorative blobs */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #F79A36, transparent)' }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 -left-24 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #58CAF2, transparent)' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 md:py-36 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/80 border border-white/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F79A36] shrink-0" />
            Nou: e-Factura ANAF integrată
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Contabilitate simplă
            <br />
            <span className="text-[#F79A36]">pentru PFA-uri</span> din România
          </h1>
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/70 mb-10 leading-relaxed">
            Emite facturi, urmărește TVA-ul și calculatorul fiscal — totul într-un singur loc.
            Fără contabil, fără Excel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-bold bg-white text-[#004AAD] hover:bg-blue-50 transition-colors shadow-lg shadow-black/20"
            >
              Începe gratuit
              <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" />
              </svg>
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-base font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              Vezi cum funcționează
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {[
              { icon: '🔒', text: 'Date securizate' },
              { icon: '🇷🇴', text: 'Conform legislației române' },
              { icon: '⚡', text: 'Setup în 2 minute' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-white/60 text-sm">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-white py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B3E] mb-4">
              Tot ce ai nevoie, nimic în plus
            </h2>
            <p className="text-[#5A6A8A] text-lg max-w-xl mx-auto">
              Instrumentele esențiale pentru a-ți gestiona afacerea ca un profesionist.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-[#E2EAF4] hover:border-[#004AAD]/30 hover:shadow-lg hover:shadow-[#004AAD]/5 transition-all duration-200 bg-white"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="text-base font-bold text-[#0D1B3E] mb-2">{title}</h3>
                <p className="text-sm text-[#5A6A8A] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 md:py-28" style={{ background: '#EEF4FF' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0D1B3E] mb-4">
              Simplu și transparent
            </h2>
            <p className="text-[#5A6A8A] text-lg">
              Fără surprize, fără costuri ascunse.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-[#E2EAF4] p-8 flex flex-col">
              <h3 className="text-lg font-bold text-[#0D1B3E] mb-1">Gratuit</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold text-[#0D1B3E]">0</span>
                <span className="text-lg text-[#5A6A8A] mb-1">RON/lună</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['5 facturi/lună', '1 client', 'Calculator fiscal', 'Fără e-Factura'].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-[#5A6A8A]">
                    <svg className="w-4 h-4 text-[#8FA3C0] shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
                      <path d="M5 12h14" stroke="currentColor" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold border border-[#E2EAF4] text-[#5A6A8A] hover:border-[#004AAD]/30 hover:text-[#004AAD] transition-colors"
              >
                Începe gratuit
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-[#004AAD] rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-xl shadow-[#004AAD]/25">
              <div
                aria-hidden
                className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10"
                style={{ background: 'radial-gradient(circle, #F79A36, transparent)', transform: 'translate(20%, -20%)' }}
              />
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F79A36] text-white text-xs font-bold mb-4 self-start">
                Popular
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Pro</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold text-white">49</span>
                <span className="text-lg text-white/60 mb-1">RON/lună</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Facturi nelimitate',
                  'Toți clienții',
                  'e-Factura ANAF',
                  'Suport prioritar',
                  'Calculator fiscal avansat',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                    <svg className="w-4 h-4 text-[#F79A36] shrink-0" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" stroke="currentColor" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=pro"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-bold bg-[#F79A36] text-white hover:bg-[#e8871f] transition-colors shadow-md shadow-[#F79A36]/30"
              >
                Începe Pro
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-[#8FA3C0] mt-8">
            Fără contract, poți anula oricând
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0D1B3E] text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-white/10">
            <div>
              <TaxlyLogo />
              <p className="mt-3 text-sm text-white/50 max-w-xs">
                Construit pentru antreprenorii din România
              </p>
            </div>
            <nav className="flex flex-wrap gap-6">
              {[
                { href: '/login', label: 'Login' },
                { href: '/register', label: 'Înregistrare' },
                { href: '/terms', label: 'Termeni' },
                { href: '/privacy', label: 'Confidențialitate' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-8 text-xs text-white/30 text-center md:text-left">
            © 2025 Taxly. Toate drepturile rezervate.
          </p>
        </div>
      </footer>
    </div>
  )
}
