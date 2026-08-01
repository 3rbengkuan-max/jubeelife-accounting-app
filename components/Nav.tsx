"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "▚" },
  { href: "/transactions", label: "Transactions", icon: "⇄" },
  { href: "/invoices", label: "Invoices", icon: "🧾" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/properties", label: "Properties & Units", icon: "🏢" },
  { href: "/tenancies", label: "Tenancies", icon: "📄" },
  { href: "/tenants", label: "Tenants", icon: "👤" },
  { href: "/accounts", label: "Chart of Accounts", icon: "≣" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="flex flex-col gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive(l.href)
              ? "bg-white/15 text-white"
              : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
          }`}
        >
          <span className="w-5 text-center text-base opacity-90">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
