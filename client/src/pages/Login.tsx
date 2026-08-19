import { ArrowRight, CheckCircle2, Eye, EyeOff, ShieldCheck, Wrench } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { Role, User } from "../types";

const demos: Array<{ role: Role; label: string; email: string }> = [
  { role: "customer", label: "Customer", email: "customer@autoserve.demo" },
  { role: "technician", label: "Technician", email: "technician@autoserve.demo" },
  { role: "admin", label: "Admin", email: "admin@autoserve.demo" },
];

export function Login({ onLogin }: { onLogin: (email: string, password: string) => Promise<User> }) {
  const [email, setEmail] = useState(demos[0].email);
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="AutoServe workshop">
        <div className="login-brand"><span><Wrench size={20} /></span><strong>AutoServe</strong></div>
        <div className="login-visual__copy">
          <p>Vehicle service, clearly managed.</p>
          <h1>Keep every repair moving.</h1>
          <div className="login-proof"><span><ShieldCheck size={17} /> Role-secure workspace</span><span><CheckCircle2 size={17} /> Live service progress</span></div>
        </div>
        <p className="login-visual__caption">One connected view from booking to final invoice.</p>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <div className="login-panel__mobile-brand"><span><Wrench size={18} /></span><strong>AutoServe</strong></div>
          <p className="eyebrow">Secure workspace</p>
          <h2>Welcome back</h2>
          <p className="login-subtitle">Sign in to continue to your service dashboard.</p>

          <div className="demo-switcher" aria-label="Demo account">
            {demos.map((demo) => <button type="button" key={demo.role} className={email === demo.email ? "is-active" : ""} onClick={() => { setEmail(demo.email); setPassword("demo123"); }}>{demo.label}</button>)}
          </div>

          <form onSubmit={submit}>
            <label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
            <label>Password<span className="password-field"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={6} required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            {error && <div className="form-error">{error}</div>}
            <button className="button button--primary button--full" type="submit" disabled={loading}>{loading ? <span className="spinner spinner--light" /> : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>
          <p className="login-help">All demo accounts use password <strong>demo123</strong></p>
        </div>
      </section>
    </main>
  );
}
