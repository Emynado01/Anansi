"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/catalog", label: "Catalogue", icon: LibraryIcon },
  { href: "/#lecteur", label: "Lecture", icon: PlayIcon },
  { href: "/auth/signin?callbackUrl=/admin", label: "Admin", icon: UserIcon },
];

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="m4 10 8-7 8 7v10a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M4 5h3v14H4z" />
      <path d="M9 5h3v14H9z" />
      <path d="M15 5h3v14h-3z" />
    </svg>
  );
}

function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M8 5.14v13.72L18 12 8 5.14z" />
    </svg>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}

const MobileBottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 md:hidden">
      <ul className="flex justify-around">
        {items.map((item) => {
          const pathRoot = item.href.replace(/#.*$/, "");
          const isActive = pathRoot === "/"
            ? pathname === "/"
            : pathname.startsWith(pathRoot);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-3 text-xs font-semibold text-slate-500 transition",
                  isActive ? "text-brand-500" : "hover:text-brand-400",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
