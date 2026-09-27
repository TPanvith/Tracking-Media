import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AcceptOrganizationInvitation } from "@/components/accept-organization-invitation";

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  if (!id || id.length > 200) notFound();
  return <Suspense fallback={<main className="auth-page"><p>Loading invitation…</p></main>}><AcceptOrganizationInvitation invitationId={id} /></Suspense>;
}
