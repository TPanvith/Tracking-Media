import { NextResponse } from "next/server";
import { z } from "zod";
import { canWriteWork, getWorkspaceMembership } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const createTrackerSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(1000).default(""),
  visibility: z.enum(["TEAM", "OWNER_AND_ADMINS"]).default("TEAM"),
});

type Context = { params: Promise<{ organizationId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { organizationId } = await params;
  const { session, membership } = await getWorkspaceMembership(organizationId);
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!membership) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });

  const isWorkspaceAdmin = membership.role === "owner" || membership.role === "admin";
  const trackers = await prisma.workTracker.findMany({
    where: isWorkspaceAdmin ? { organizationId } : {
      organizationId,
      OR: [{ visibility: "TEAM" }, { ownerId: session.user.id }],
    },
    orderBy: { updatedAt: "desc" },
    include: { owner: { select: { id: true, name: true } }, _count: { select: { entries: true } } },
  });
  return NextResponse.json({ trackers });
}

export async function POST(request: Request, { params }: Context) {
  const { organizationId } = await params;
  const { session, membership } = await getWorkspaceMembership(organizationId);
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!membership) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (!canWriteWork(membership.role)) return NextResponse.json({ error: "Your workspace role cannot create trackers." }, { status: 403 });

  const parsed = createTrackerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a tracker title and valid settings." }, { status: 400 });

  const tracker = await prisma.workTracker.create({
    data: { organizationId, ownerId: session.user.id, ...parsed.data },
    select: { id: true, title: true, description: true, visibility: true, createdAt: true },
  });
  await prisma.workAuditEvent.create({
    data: { organizationId, actorId: session.user.id, action: "tracker.created", resourceType: "work_tracker", resourceId: tracker.id },
  });
  return NextResponse.json({ tracker }, { status: 201 });
}
