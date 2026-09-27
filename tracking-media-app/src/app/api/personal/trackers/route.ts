import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/access";
import { prisma } from "@/lib/prisma";

const createTrackerSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().max(1000).default(""),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = createTrackerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a tracker title and valid description." }, { status: 400 });

  const tracker = await prisma.personalTracker.create({
    data: { ownerId: session.user.id, ...parsed.data },
    select: { id: true, title: true, description: true, createdAt: true },
  });
  return NextResponse.json({ tracker }, { status: 201 });
}
