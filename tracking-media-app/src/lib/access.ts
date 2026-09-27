import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getWorkspaceMembership(organizationId: string) {
  const session = await getSession();
  if (!session) return { session: null, membership: null };
  const membership = await prisma.member.findUnique({
    where: { organizationId_userId: { organizationId, userId: session.user.id } },
  });
  return { session, membership };
}

export function canWriteWork(role: string): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

export function canManageWorkspace(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function canReadWorkTracker(
  tracker: { ownerId: string; visibility: "TEAM" | "OWNER_AND_ADMINS" },
  userId: string,
  role: string,
): boolean {
  return tracker.visibility === "TEAM" || tracker.ownerId === userId || canManageWorkspace(role);
}
