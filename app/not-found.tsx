import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="text-3xl font-bold text-slate-300">404</div>
      <h2 className="mt-2 text-lg font-semibold text-slate-700">Page not found</h2>
      <p className="mt-1 text-sm text-slate-500">
        That page doesn&apos;t exist. Head back to your dashboard.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
