import { NextResponse } from "next/server";
import { z } from "zod";
import { canReadWorkTracker, canWriteWork, getWorkspaceMembership } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const entrySchema = z.object({ value: z.unknown(), note: z.string().trim().max(2000).default("") });
type Context = { params: Promise<{ organizationId: string; trackerId: string }> };

export async function POST(request: Request, { params }: Context) {
  const { organizationId, trackerId } = await params;
  const { session, membership } = await getWorkspaceMembership(organizationId);
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!membership) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (!canWriteWork(membership.role)) return NextResponse.json({ error: "Your workspace role cannot add tracker updates." }, { status: 403 });

  const tracker = await prisma.workTracker.findFirst({ where: { id: trackerId, organizationId } });
  if (!tracker || !canReadWorkTracker(tracker, session.user.id, membership.role)) {
    return NextResponse.json({ error: "Tracker not found." }, { status: 404 });
  }
  const parsed = entrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid tracker value." }, { status: 400 });

  const [entry] = await prisma.$transaction([
    prisma.workTrackerEntry.create({
      data: { trackerId, authorId: session.user.id, ...parsed.data },
      select: { id: true, value: true, note: true, createdAt: true },
    }),
    prisma.workTracker.update({ where: { id: trackerId }, data: { updatedAt: new Date() } }),
    prisma.workAuditEvent.create({
      data: { organizationId, actorId: session.user.id, action: "tracker.entry.created", resourceType: "work_tracker", resourceId: trackerId },
    }),
  ]);
  return NextResponse.json({ entry }, { status: 201 });
}
