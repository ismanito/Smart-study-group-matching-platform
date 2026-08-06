import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="-mx-4 -mt-6 min-h-screen bg-paper sm:-mx-6 lg:-mx-8">
      <section className="relative isolate min-h-[88vh] overflow-hidden bg-hero-mesh text-paper-card">
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-40 mix-blend-soft-light" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-brass/20 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute left-10 top-24 h-56 w-56 rounded-full bg-pine-mist/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-6 pb-20 pt-28 sm:px-10 lg:justify-center lg:pb-24">
          <p className="animate-rise font-display text-4xl font-semibold tracking-tight text-brass-soft sm:text-5xl lg:text-6xl">
            StudyMatch
          </p>
          <h1 className="animate-rise mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl" style={{ animationDelay: '120ms' }}>
            Form study groups that actually fit how you learn.
          </h1>
          <p className="animate-rise-slow mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg" style={{ animationDelay: '220ms' }}>
            Match with classmates by subject, availability, and study style—then keep notes, sessions, and progress in one calm place.
          </p>
          <div className="animate-rise-slow mt-10 flex flex-wrap gap-3" style={{ animationDelay: '320ms' }}>
            <Link to="/register" className="rounded-md bg-brass px-7 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
              Create account
            </Link>
            <Link
              to="/login"
              className="rounded-md border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-paper-line bg-paper-card px-6 py-20 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">What it does</p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Built for serious collaboration, not noisy feeds.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
            StudyMatch helps you find peers in the same courses, align schedules, and share materials without clutter.
            The interface stays quiet so your focus stays on the work.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pine">How it works</p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-ink sm:text-4xl">
            Three steps from signup to your next session.
          </h2>

          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Set your profile',
                copy: 'Add courses, subjects, and the hours you can actually meet.',
              },
              {
                step: '02',
                title: 'Match with peers',
                copy: 'See classmates ranked by shared subjects and schedule overlap.',
              },
              {
                step: '03',
                title: 'Study together',
                copy: 'Join groups, share notes, and keep sessions moving.',
              },
            ].map((item) => (
              <li key={item.step} className="border-t border-paper-line pt-6">
                <p className="font-display text-sm font-semibold text-brass">{item.step}</p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-muted">{item.copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-paper-line bg-pine-deep px-6 py-16 text-paper-card sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ready when your next exam is.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Start with a student account and invite classmates once you find a good match.
            </p>
          </div>
          <Link to="/register" className="inline-flex rounded-md bg-brass px-7 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
            Get started
          </Link>
        </div>
      </section>

      <footer className="px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-lg font-semibold text-ink">StudyMatch</p>
          <p className="text-sm text-ink-muted">© {new Date().getFullYear()} StudyMatch</p>
        </div>
      </footer>
    </div>
  );
}
