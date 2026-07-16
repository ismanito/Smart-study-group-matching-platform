import { Link } from 'react-router-dom';

export default function LandingPage() {
  const features = [
    {
      title: 'Smart Matching',
      description: 'Connect with peers who share your courses, study habits, and goals.',
      icon: '🤝',
    },
    {
      title: 'Share Notes',
      description: 'Keep your study materials organized and available for your group.',
      icon: '📝',
    },
    {
      title: 'Coordinate Schedules',
      description: 'Plan sessions faster with calendar-friendly group coordination.',
      icon: '📅',
    },
  ];

  const steps = [
    {
      title: 'Register',
      description: 'Create your account and tell us your study preferences.',
    },
    {
      title: 'Get Matched',
      description: 'We pair you with compatible classmates and study groups.',
    },
    {
      title: 'Study Together',
      description: 'Collaborate, share notes, and keep each other accountable.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-900 py-24">
        <div className="absolute inset-x-0 top-0 h-64 bg-white/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-8">
            <p className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-sky-100 shadow-sm">
              Study smarter, not harder
            </p>
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Find Your Study Tribe
            </h1>
            <p className="text-xl leading-8 text-slate-200">
              Discover study groups designed around your classes, schedule, and learning style. Join students who help you stay motivated and succeed together.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-slate-900/20 transition hover:bg-slate-100"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/20"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.32em] text-sky-200">Why StudyMatch</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">Built for group success</h2>
              <p className="mt-4 text-slate-200">
                Create meaningful study connections, organize fast, and keep momentum with the right people.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-sky-500/10 p-8 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
              <p className="text-sm uppercase tracking-[0.32em] text-sky-200">Launch your next session</p>
              <h2 className="mt-4 text-3xl font-semibold text-white">A platform that keeps you focused</h2>
              <p className="mt-4 text-slate-200">
                Stay on top of your coursework with note sharing, schedule sync, and active group chats.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
        <div className="mb-12 text-center">
          <p className="text-sm uppercase tracking-[0.32em] text-sky-500">Features</p>
          <h2 className="mt-4 text-4xl font-bold text-slate-900">Everything you need for collaborative study.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
            From finding the best study matches to keeping shared notes and organizing meetings, StudyMatch keeps your team moving forward.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-3xl">
                {feature.icon}
              </div>
              <h3 className="mt-6 text-2xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-4 text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-20 text-white sm:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="text-sm uppercase tracking-[0.32em] text-sky-300">How it works</p>
            <h2 className="mt-4 text-4xl font-bold">Start studying with confidence in three easy steps.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-xl font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-4 text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-6 py-10 text-slate-700 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xl font-semibold text-slate-900">StudyMatch</p>
            <p className="mt-2 max-w-xl text-sm text-slate-500">Bring your classes, notes, and schedules together in one collaborative study hub.</p>
          </div>
          <p className="text-sm text-slate-500">© 2026 StudyMatch. Empowering study groups that succeed together.</p>
        </div>
      </footer>
    </div>
  );
}
