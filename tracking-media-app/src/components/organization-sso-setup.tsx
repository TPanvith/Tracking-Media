"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type SsoProvider = { providerId: string; verificationToken?: string };

export function OrganizationSsoSetup({ organizationId }: { organizationId: string }) {
  const [provider, setProvider] = useState<SsoProvider | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(""); setError(""); setBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const providerId = String(form.get("providerId")).trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    try {
      const result = await authClient.sso.register({
        providerId,
        issuer: String(form.get("issuer")).trim(),
        domain: String(form.get("domain")).trim().toLowerCase(),
        organizationId,
        oidcConfig: { clientId: String(form.get("clientId")).trim(), clientSecret: String(form.get("clientSecret")) },
      });
      if (result.error) throw new Error(result.error.message || "Could not connect this identity provider.");
      const details = result.data as unknown as Record<string, unknown>;
      const token = typeof details?.verificationToken === "string" ? details.verificationToken : undefined;
      setProvider({ providerId, verificationToken: token });
      setMessage("Identity provider registered. Verify the company domain before enabling sign-in.");
      formElement.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not register the identity provider.");
    } finally { setBusy(false); }
  }

  async function verifyDomain() {
    if (!provider) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await authClient.sso.verifyDomain({ providerId: provider.providerId });
      if (result.error) throw new Error(result.error.message || "Domain verification was not successful yet.");
      setMessage("Domain verified. Members from this identity provider can now sign in to this workspace.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Domain verification was not successful yet.");
    } finally { setBusy(false); }
  }

  return <div className="sso-panel">
    <p className="muted">Connect your company identity provider. Add its issuer origin to SSO_TRUSTED_ORIGINS in the app environment before registering it. SSO members are added as workspace members; access still follows this organization’s roles.</p>
    <form className="sso-form" onSubmit={register}>
      <label>Provider ID<input name="providerId" required maxLength={64} placeholder="acme-workforce" /></label>
      <label>OIDC issuer URL<input name="issuer" type="url" required placeholder="https://login.example.com" /></label>
      <label>Company email domain<input name="domain" required placeholder="example.com" /></label>
      <label>Client ID<input name="clientId" required autoComplete="off" /></label>
      <label>Client secret<input name="clientSecret" type="password" required autoComplete="new-password" /></label>
      {error && <p className="form-message" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
      <button className="button warm" disabled={busy}>{busy ? "Working…" : "Register OIDC provider"}</button>
    </form>
    {provider && <div className="sso-verification"><b>Verify domain ownership</b><p>Add this DNS TXT record, then choose “Verify domain”. The provider stays untrusted until verification succeeds.</p><code>Host: _better-auth-token-{provider.providerId}</code>{provider.verificationToken ? <code>Value: {provider.verificationToken}</code> : <span className="subtle">Use the verification token returned during provider registration.</span>}<button className="button secondary" disabled={busy} onClick={verifyDomain}>Verify domain</button></div>}
    <p className="sso-redirect"><b>Callback URL for your identity provider</b><code>{process.env.NEXT_PUBLIC_APP_URL}/api/auth/sso/callback/{provider?.providerId ?? "{providerId}"}</code></p>
  </div>;
}
