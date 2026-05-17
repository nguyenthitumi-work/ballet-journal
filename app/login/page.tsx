import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <section className="flex flex-col items-center gap-6 py-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Sign in to Ballet Journal</h1>
      <p className="max-w-md text-violet-900/80">
        Enter your email and we&apos;ll send you a verification code. No password needed.
      </p>
      <LoginForm />
    </section>
  );
}
