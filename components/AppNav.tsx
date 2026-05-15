import Link from "next/link";
import { Activity, BarChart3, GitCompare, LineChart } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LineChart },
  { href: "/rankings", label: "หุ้นมาแรง", icon: BarChart3 },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/options", label: "Options", icon: Activity }
];

export function AppNav() {
  return (
    <nav className="border-b border-line bg-ink/75 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="text-sm font-semibold uppercase tracking-wide text-white">Stock Auto Analyzer</Link>
        <div className="flex flex-wrap gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="focus-ring inline-flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 text-sm text-slate-200 hover:border-cyan/60">
              <Icon className="h-4 w-4 text-cyan" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
