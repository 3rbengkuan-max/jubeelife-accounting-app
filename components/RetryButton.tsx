"use client";

export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="mt-5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
    >
      Retry
    </button>
  );
}
