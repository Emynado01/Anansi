import SignUpForm from "./SignUpForm";

const SignUpPage = () => {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-[8px] border border-slate-200 bg-white/90 p-8 shadow-xl shadow-brand-200/30 dark:border-slate-700 dark:bg-slate-900/80">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Créer un accès admin</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Réservé à la création d’un compte administrateur Anansi.
        </p>
      </div>
      <SignUpForm />
    </div>
  );
};

export default SignUpPage;
