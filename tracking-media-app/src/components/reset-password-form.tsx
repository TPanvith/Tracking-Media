"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token, invalid }: { token: string; invalid: boolean }) {
  const [message, setMessage] = useState(invalid ? "This reset link is invalid or has expired. Request a new one to continue." : "");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setMessage("The passwords do not match.");
      return;
    }
    if (!token) {
      setMessage("This reset link is missing its security token. Request a new link.");
      return;
    }
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) throw new Error(result.error.message || "The reset link could not be used.");
      setDone(true);
      setMessage("Your password has been updated. You can now sign in with it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset your password. Request a new link and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="auth-card reset-card" aria-labelledby="reset-title"><p className="eyebrow">ACCOUNT SECURITY</p><h1 id="reset-title">Choose a new password</h1><p className="muted">Create a password with at least 12 characters. For your security, your other sessions will be signed out.</p>
    {!done && <form className="form-stack" onSubmit={submit}><label htmlFor="new-password">New password<input id="new-password" name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required aria-describedby="reset-password-hint" /></label><small className="field-hint" id="reset-password-hint">At least 12 characters.</small><label htmlFor="confirm-password">Confirm new password<input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label><button className="button primary" type="submit" disabled={busy || !token}>{busy ? "Updating password…" : "Update password"}</button></form>}
    {message && <p className={done ? "form-success auth-message" : "form-message auth-message"} role={done ? "status" : "alert"} aria-live="polite">{message}</p>}
    <p className="auth-toggle"><Link className="link-button" href="/sign-in">Back to sign in</Link>{invalid && <> · <Link className="link-button" href="/sign-in?mode=forgot">Request a new reset link</Link></>}</p>
  </section>;
}

