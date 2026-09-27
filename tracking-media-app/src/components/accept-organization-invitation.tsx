"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

type InviteInfo = { email: string; organizationId: string; organization?: { name?: string } };

export function AcceptOrganizationInvitation({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [invitation, setInvitation] = useState<InviteInfo | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    authClient.organization.getInvitation({ query: { id: invitationId } }).then((result) => {
      if (!active) return;
      if (result.error || !result.data) setError(result.error?.message || "This invitation is unavailable or has expired.");
      else setInvitation(result.data as unknown as InviteInfo);
    }).catch(() => { if (active) setError("This invitation is unavailable or has expired."); });
    return () => { active = false; };
  }, [invitationId]);

  async function accept() {
    setBusy(true); setError("");
    try {
      const result = await authClient.organization.acceptInvitation({ invitationId });
      if (result.error) throw new Error(result.error.message || "Could not accept this invitation.");
      router.replace("/dashboard"); router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not accept this invitation.");
    } finally { setBusy(false); }
  }

  const returnTo = `/accept-invitation?id=${encodeURIComponent(invitationId)}`;
  return <main className="auth-page"><Link className="brand" href="/">tracking<span>media</span></Link><section className="auth-card"><p className="eyebrow">ORGANIZATION WORKSPACE</p><h1>Join your team</h1>{invitation ? <><p className="muted">Invitation for <b>{invitation.email}</b>{invitation.organization?.name ? <> to join <b>{invitation.organization.name}</b></> : " to join an organization workspace"}.</p><p className="muted invite-hint">Sign in with this invited email address to accept. Personal trackers stay separate from organization work.</p><button className="button warm invite-accept" onClick={accept} disabled={busy}>{busy ? "Joining…" : "Accept invitation"}</button></> : <p className="muted">{error || "Checking invitation…"}</p>}{error && invitation && <p className="form-message" role="alert">{error}</p>}<p className="auth-toggle">Need to sign in first? <Link className="link-button" href={`/sign-in?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</Link></p></section></main>;
}
