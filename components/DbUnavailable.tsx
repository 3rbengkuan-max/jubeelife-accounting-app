import RetryButton from "@/components/RetryButton";

export default function DbUnavailable({ detail }: { detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-6 py-16 text-center">
      <div className="text-3xl">🔌</div>
      <h2 className="mt-3 text-lg font-semibold text-amber-900">
        Can&apos;t reach the database
      </h2>
      <p className="mt-1 max-w-md text-sm text-amber-800">
        Your data is safe — the app just couldn&apos;t connect right now. This
        usually means the database was paused after a period of inactivity, or
        there&apos;s a brief connection hiccup.
      </p>
      <p className="mt-2 max-w-md text-xs text-amber-700/80">
        If it keeps happening, open your Supabase dashboard and resume the
        project, then retry.
      </p>
      <RetryButton />
      {detail && (
        <p className="mt-4 max-w-md break-words text-[11px] text-amber-700/60">
          {detail}
        </p>
      )}
    </div>
  );
}
