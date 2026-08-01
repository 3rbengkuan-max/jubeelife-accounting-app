import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Jubeelife Accounting",
  description:
    "Simple accounting for Jubeelife Pte Ltd — transactions, tenancies, invoices, and Singapore-aligned P&L / Balance Sheet / Cash Flow reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[var(--brand-dark)] p-4 md:flex">
            <Link href="/" className="mb-6 block px-2">
              <div className="text-lg font-bold text-white">Jubeelife</div>
              <div className="text-xs text-emerald-100/70">Accounting · SGD</div>
            </Link>
            <Nav />
            <div className="mt-auto px-2 pt-6 text-[11px] leading-relaxed text-emerald-100/50">
              Demo mode — shared data, no login. Aligned with ACRA/IRAS
              simplified single-entry.
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-8">
              <div className="md:hidden">
                <Link href="/" className="font-bold text-[var(--brand-dark)]">
                  Jubeelife
                </Link>
              </div>
              <div className="hidden text-sm text-slate-500 md:block">
                Jubeelife Pte Ltd · Property &amp; Room Rental
              </div>
              <Link
                href="/transactions/new"
                className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
              >
                + New Transaction
              </Link>
            </header>
            <main className="print-full mx-auto w-full max-w-6xl flex-1 p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
