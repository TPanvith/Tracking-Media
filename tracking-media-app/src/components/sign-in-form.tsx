"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup" | "forgot";

export function SignInForm({ returnTo = "/dashboard", initialMode = "signin" }: { returnTo?: string; initialMode?: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function changeMode(next: Mode) {
    setMode(next);
    setMessage("");
    setSuccess(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    try {
      if (mode === "forgot") {
        const redirectTo = `${window.location.origin}/reset-password`;
        const result = await authClient.requestPasswordReset({ email, redirectTo });
        if (result.error) throw new Error(result.error.message || "Could not send a reset link.");
        setSuccess(true);
        setMessage("If an account exists for this address, a password reset link will be sent. Check your inbox.");
        return;
      }
      if (mode === "signup") {
        const result = await authClient.signUp.email({ name: String(form.get("name") ?? ""), email, password: String(form.get("password") ?? ""), callbackURL: returnTo });
        if (result.error) throw new Error(result.error.message || "Could not create your account.");
        setSuccess(true);
        setMessage("Check your email for a verification link. In local development, the link appears in the dev server terminal.");
        return;
      }
      const result = await authClient.signIn.email({ email, password: String(form.get("password") ?? ""), callbackURL: returnTo });
      if (result.error) throw new Error(result.error.message || "Sign-in failed.");
      router.push(returnTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function companySignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.sso({ email: String(form.get("ssoEmail") ?? "").trim(), callbackURL: returnTo });
      if (result.error) throw new Error(result.error.message || "This organization has not connected its identity provider yet.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Organization sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password";

  return <main className="auth-page"><div className="auth-layout">
    <aside className="auth-story">
      <a className="brand" href="/" aria-label="Tracking Media home">tracking<span>media</span></a>
      <div className="auth-story-copy"><p className="eyebrow">ONE PLATFORM · THREE CLEAR SPACES</p><h2>Keep every important thing in view.</h2><p>Build a rhythm for your own goals, work confidently with your team, and follow data the public can trust.</p></div>
      <div className="auth-space-list"><div><span className="space-glyph personal-glyph" aria-hidden="true">✳</span><span><b>Personal</b><small>Your goals, your space</small></span></div><div><span className="space-glyph public-glyph" aria-hidden="true">↗</span><span><b>Public</b><small>Sources in plain sight</small></span></div><div><span className="space-glyph work-glyph" aria-hidden="true">▦</span><span><b>Work</b><small>Private team workspace</small></span></div></div>
      <div className="auth-illustration" aria-hidden="true"><div className="illustration-top"><i/><i/><i/><span>your tracking space</span></div><div className="illustration-content"><div className="illustration-line line-wide"/><div className="illustration-line line-short"/><div className="illustration-chart"><i/><i/><i/><i/><i/><i/><i/></div><div className="illustration-foot"><span/><span/><span/></div></div></div>
    </aside>
    <section className="auth-card" aria-labelledby="auth-title">
      <p className="eyebrow">ONE ACCOUNT · DISTINCT SPACES</p>
      <h1 id="auth-title">{title}</h1>
      <p className="muted">{mode === "forgot" ? "Enter the email address on your account and we’ll send reset instructions if it matches." : "Your personal dashboard and team workspaces have separate access boundaries."}</p>
      <form className="form-stack" onSubmit={submit} noValidate={false}>
        {mode === "signup" && <label htmlFor="account-name">Your name<input id="account-name" name="name" type="text" autoComplete="name" required maxLength={120} /></label>}
        <label htmlFor="account-email">Email address<input id="account-email" name="email" type="email" autoComplete="email" required autoFocus={mode === "forgot"} /></label>
        {mode !== "forgot" && <div className="field-group"><label htmlFor="account-password">Password</label><div className="password-control"><input id="account-password" name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={12} maxLength={128} required aria-describedby="password-hint" /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button></div>{mode === "signup" && <small id="password-hint" className="field-hint">Use at least 12 characters.</small>}</div>}
        {mode === "signin" && <div className="forgot-row"><button type="button" className="link-button" onClick={() => changeMode("forgot")}>Forgot password?</button></div>}
        <button className="button primary" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}</button>
        {mode === "forgot" && <button className="button secondary" type="button" onClick={() => changeMode("signin")}>Back to sign in</button>}
      </form>
      {message && <p className={success ? "form-success auth-message" : "form-message auth-message"} role={success ? "status" : "alert"} aria-live="polite">{message}</p>}
      {mode !== "forgot" && <><div className="auth-divider"><span>OR USE YOUR ORGANIZATION</span></div><form className="form-stack" onSubmit={companySignIn}><label htmlFor="organization-email">Organization email<input id="organization-email" name="ssoEmail" type="email" autoComplete="email" placeholder="you@company.com" required /></label><button className="button secondary" type="submit" disabled={busy}>Continue with company SSO</button></form></>}
      {mode !== "forgot" && <p className="auth-toggle">{mode === "signin" ? "New to Tracking Media?" : "Already have an account?"} <button type="button" className="link-button" onClick={() => changeMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>}
    </section>
  </div><p className="auth-foot">Organization sign-in uses the identity provider configured by your organization administrator.</p></main>;
}

