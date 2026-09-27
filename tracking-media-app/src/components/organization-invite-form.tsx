"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function OrganizationInviteForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await authClient.organization.inviteMember({
        organizationId,
        email: String(form.get("email")).trim().toLowerCase(),
        role: String(form.get("role")) as "admin" | "member",
      });
      if (result.error) throw new Error(result.error.message || "Could not send the invitation.");
      formElement.reset();
      setMessage("Invitation email sent. The recipient must verify their email and accept the invite to join.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send the invitation.");
    } finally { setBusy(false); }
  }

  return <form className="invite-form" onSubmit={submit}>
    <label>Teammate email<input name="email" type="email" required autoComplete="email" placeholder="teammate@company.com" /></label>
    <label>Workspace role<select name="role" defaultValue="member"><option value="member">Member · create and update work trackers</option><option value="admin">Admin · manage workspace and members</option></select></label>
    {error && <p className="form-message" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}
    <button className="button warm" disabled={busy}>{busy ? "Sending…" : "Send invitation"}</button>
  </form>;
}
