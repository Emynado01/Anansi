import Link from "next/link";

import ThemeToggle from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/catalog", label: "Catalogue" },
  { href: "/player", label: "Lecteur" },
];

const Header = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/75 backdrop-blur-xl transition dark:border-white/10 dark:bg-black/65">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-brand-300 bg-black text-brand-200 shadow-glow">A</span>
          Anansi
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-300">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-brand-600 dark:hover:text-brand-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/auth/signin?callbackUrl=/admin"
            className="hidden rounded-[8px] border border-brand-300/60 bg-black px-4 py-2 text-sm font-semibold text-brand-100 shadow-glow transition hover:border-brand-200 hover:text-white md:inline-flex dark:bg-white/5"
          >
            Connexion admin
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

