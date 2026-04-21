"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";

const SignUpForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupSecret, setSignupSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            signupSecret,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setError(data.error ?? "Impossible de créer le compte.");
          return;
        }

        await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        router.push("/admin");
        router.refresh();
      } catch (err) {
        console.error(err);
        setError("Une erreur inattendue est survenue.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nom complet
        </label>
        <input
          id="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-brand-500/40"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-brand-500/40"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Mot de passe
        </label>
        <input
          id="signup-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-brand-500/40"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="signup-secret" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Code administrateur
        </label>
        <input
          id="signup-secret"
          type="password"
          value={signupSecret}
          onChange={(event) => setSignupSecret(event.target.value)}
          className="w-full rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-brand-500/40"
        />
      </div>
      {error && <p className="rounded-[8px] bg-red-100 px-4 py-2 text-sm text-red-700 dark:bg-red-900/40 dark:text-red-200">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-[8px] bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Créer l’accès admin
      </button>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Déjà membre ? {" "}
        <Link href="/auth/signin" className="font-semibold text-brand-600 hover:text-brand-500">
          Se connecter
        </Link>
      </p>
    </form>
  );
};

export default SignUpForm;
