"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (clientError) {
      setError(clientError instanceof Error ? clientError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto mt-14 max-w-md rounded-2xl border border-[var(--border-soft)] bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-extrabold text-[var(--brand-red-strong)]">Log in</h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">Use your email and password.</p>

      <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm"
        />
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="w-full rounded-lg border border-[var(--border-soft)] px-3 py-2 text-sm"
        />

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-[var(--ink-soft)]">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-[var(--brand-red)] underline-offset-2 hover:underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
