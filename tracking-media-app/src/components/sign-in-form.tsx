"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")), callbackURL: returnTo });
        if (result.error) throw new Error(result.error.message || "Could not create your account.");
        setMessage("Check your email for a verification link. For local development without email credentials, find the link in the dev server terminal.");
        return;
      } else {
        const result = await authClient.signIn.email({ email: String(form.get("email")), password: String(form.get("password")), callbackURL: returnTo });
        if (result.error) throw new Error(result.error.message || "Sign-in failed.");
      }
      router.push(returnTo); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }

  async function companySignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.sso({ email: String(form.get("ssoEmail")), callbackURL: returnTo });
      if (result.error) throw new Error(result.error.message || "This organization has not connected its identity provider yet.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Organization sign-in failed."); setBusy(false); }
  }

  return <main className="auth-page"><a className="brand" href="/">tracking<span>media</span></a><section className="auth-card"><p className="eyebrow">ONE ACCOUNT · DISTINCT SPACES</p><h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1><p className="muted">Your personal dashboard and team workspaces have separate access boundaries.</p>
    <form className="form-stack" onSubmit={submit}>{mode === "signup" && <label>Your name<input name="name" autoComplete="name" required maxLength={120} /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>Password<input name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={12} required /></label><button className="button primary" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}</button></form>
    <div className="auth-divider"><span>OR USE YOUR ORGANIZATION</span></div><form className="form-stack" onSubmit={companySignIn}><label>Organization email<input name="ssoEmail" type="email" placeholder="you@company.com" required /></label><button className="button secondary" disabled={busy}>Continue with company SSO</button></form>
    {message && <p className="form-message" role="alert">{message}</p>}<p className="auth-toggle">{mode === "signin" ? "New to Tracking Media?" : "Already have an account?"} <button type="button" className="link-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
  </section><p className="auth-foot">Organization sign-in uses the identity provider configured by your organization administrator.</p></main>;
}
