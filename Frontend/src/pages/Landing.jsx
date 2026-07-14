import { Link } from "react-router-dom";
import {
  HeartPulse,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: CalendarCheck,
    title: "Instant Appointments",
    desc: "Book verified doctors and hospitals in seconds - no phone queues, no waiting rooms.",
  },
  {
    icon: FileText,
    title: "Unified Health Records",
    desc: "Prescriptions, reports and history in one secure place, accessible anywhere.",
  },
  {
    icon: Stethoscope,
    title: "Trusted Providers",
    desc: "Every hospital and doctor on HealthSync is registration-verified before going live.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    desc: "Your medical data is encrypted end-to-end and shared only with your consent.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
              <HeartPulse size={20} />
            </span>
            <span className="font-display text-xl font-bold text-brand-900">
              HealthSync
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#eef7ff_0%,_transparent_60%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
            <HeartPulse size={14} />
            Healthcare, finally in sync
          </span>

          {/* Hook line */}
          <h1 className="font-display text-5xl font-extrabold leading-[1.1] tracking-tight text-brand-900 sm:text-6xl md:text-7xl">
            Your health,{" "}
            <span className="bg-gradient-to-r from-brand-500 to-cyan-400 bg-clip-text text-transparent">
              one tap away.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
            HealthSync connects patients, doctors and hospitals on a single
            platform - manage records, track your health and get care without
            the chaos.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-700"
            >
              Get started - it&apos;s free
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
            <Link
              to="/login?role=hospital"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 transition hover:border-brand-500 hover:text-brand-600"
            >
              <Stethoscope size={18} />
              For hospitals
            </Link>
          </div>

          {/* Highlights strip */}
          <div className="mt-14 grid w-full max-w-2xl grid-cols-1 divide-y divide-slate-200 rounded-2xl border border-slate-100 bg-white/70 shadow-sm backdrop-blur sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              "Track Health History",
              "Personalized Care Features",
              "24/7 Care Access",
            ].map((label) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2 px-4 py-5"
              >
                <HeartPulse size={16} className="shrink-0 text-brand-500" />
                <p className="font-display text-sm font-semibold text-brand-900">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">
            Everything your care needs
          </h2>
          <p className="mt-3 text-slate-500">
            One account for appointments, records and providers you can trust.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-100 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={22} />
              </span>
              <h3 className="font-display text-lg font-semibold text-brand-900">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-brand-900 px-8 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(26,140,255,0.35)_0%,_transparent_60%)]" />
          <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
            Ready to take charge of your health?
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-brand-100/80">
            Join HealthSync today - patients and hospitals welcome.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="rounded-xl bg-white px-8 py-3.5 font-semibold text-brand-900 transition hover:bg-brand-50"
            >
              Create free account
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-white/25 px-8 py-3.5 font-semibold text-white transition hover:bg-white/10"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-400 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} HealthSync. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <HeartPulse size={14} className="text-brand-500" />
            Built for better care.
          </p>
        </div>
      </footer>
    </div>
  );
}
