"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-6 py-16 text-center">
      <div className="text-2xl">⚠️</div>
      <h2 className="mt-3 text-lg font-semibold text-rose-800">Something went wrong</h2>
      <p className="mt-1 max-w-md text-sm text-rose-600">
        {error.message || "This page couldn't load. It may be a temporary connection issue."}
      </p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        Try again
      </button>
    </div>
  );
}
