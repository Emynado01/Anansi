import SignInForm from "./SignInForm";

const SignInPage = () => {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-[8px] border border-slate-200 bg-white/90 p-8 shadow-xl shadow-brand-200/30 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Connexion administrateur</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Accédez à la console pour publier et modifier les livres audio Anansi.
        </p>
      </div>
      <SignInForm />
    </div>
  );
};

export default SignInPage;
