import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { Pill, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { isAuthenticated, loading: authLoading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <Loader2 className="h-6 w-6 animate-spin text-accent-blue" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante il login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Pill className="h-10 w-10 text-accent-blue" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-text-primary">
              PharmaControl
            </h1>
            <p className="text-xs text-text-dim">
              Controllo di Gestione
            </p>
          </div>
        </div>

        {/* Login Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-card border border-border-card bg-gradient-to-b from-bg-card to-bg-primary p-6 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-text-muted"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-btn border border-border-card bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-blue transition-colors"
              placeholder="nome@farmacia.it"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-text-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-btn border border-border-card bg-bg-primary px-3 py-2.5 text-sm text-text-primary placeholder:text-text-dim outline-none focus:border-accent-blue transition-colors"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-xs text-accent-red">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-accent-blue py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-blue/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Accedi
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-text-dim">
          Powered by DottHouse.ai
        </p>
      </div>
    </div>
  );
}
