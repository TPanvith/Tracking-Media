import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, canReadWorkTracker, canWriteWork, getWorkspaceMembership } from "@/lib/access";
import { WorkTrackerForm } from "@/components/work-tracker-form";
import { WorkEntryForm } from "@/components/work-entry-form";
import { SignOutButton } from "@/components/sign-out-button";
import { OrganizationSsoSetup } from "@/components/organization-sso-setup";
import { OrganizationInviteForm } from "@/components/organization-invite-form";

export default async function OrganizationWorkPage({params}:{params:Promise<{organizationId:string}>}){
  const {organizationId}=await params;const{session,membership}=await getWorkspaceMembership(organizationId);if(!session)redirect("/sign-in");if(!membership)notFound();
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!organization) notFound();
  const trackerVisibilityScope = canManageWorkspace(membership.role)
    ? { organizationId }
    : { organizationId, OR: [{ visibility: "TEAM" as const }, { ownerId: session.user.id }] };
  const [trackers,events,pendingInvitations]=await Promise.all([
    prisma.workTracker.findMany({where:trackerVisibilityScope,orderBy:{updatedAt:"desc"},include:{owner:{select:{id:true,name:true}},entries:{orderBy:{createdAt:"desc"},take:3,include:{author:{select:{name:true}}}},_count:{select:{entries:true}}}}),
    prisma.workAuditEvent.findMany({where:{organizationId},orderBy:{createdAt:"desc"},take:12,include:{actor:{select:{name:true}}}}),
    canManageWorkspace(membership.role) ? prisma.invitation.findMany({where:{organizationId,status:"pending"},orderBy:{expiresAt:"asc"},select:{id:true,email:true,role:true,expiresAt:true}}) : Promise.resolve([]),
  ]);
  return <main className="work-page"><header className="work-header"><Link className="brand" href="/dashboard">tracking<span>media</span></Link><span className="work-word">WORK</span><div className="work-header-right"><span>{organization.name}</span><span className="role-pill">{membership.role}</span><Link href="/dashboard" className="back-link">Personal dashboard</Link><SignOutButton/></div></header>
    <div className="work-shell"><aside className="work-sidebar"><p className="eyebrow">ORGANIZATION</p><strong>{organization.name}</strong><p className="subtle">Organization-owned records</p><div className="work-nav"><a className="selected" href="#team-trackers">Team trackers</a><a href="#members">Members & roles</a><a href="#activity">Activity</a></div><div className="work-boundary-note"><b>Isolated work mode</b><span>Only workspace data is loaded here. Your personal trackers and public follows are not part of this view.</span></div></aside>
      <section className="work-content"><div className="page-title-row"><div><p className="eyebrow">WORKSPACE · {organization.slug}</p><h1>{organization.name}</h1><p className="muted">Your role is checked against organization membership for every work-data request.</p></div>{canWriteWork(membership.role)&&<WorkTrackerForm organizationId={organizationId}/>}</div>
        <section id="team-trackers" className="dashboard-section"><div className="section-title"><div><p className="eyebrow">TEAM-OWNED DATA</p><h2>Trackers <span className="count">{trackers.length}</span></h2></div></div>{trackers.length?<div className="work-tracker-list">{trackers.map(t=><article className="work-tracker-card" key={t.id}><div className="work-tracker-top"><div><span className="card-tag work-tag">{t.visibility==="TEAM"?"SHARED WITH WORKSPACE":"OWNER + ADMINS"}</span><h3>{t.title}</h3><p>{t.description||"No description added."}</p></div><span className="entry-count">{t._count.entries} updates</span></div><div className="work-meta"><span>Owner · {t.owner.name}</span>{canWriteWork(membership.role)&&canReadWorkTracker(t,session.user.id,membership.role)&&<WorkEntryForm organizationId={organizationId} trackerId={t.id}/>}</div>{t.entries.length>0&&<div className="recent-work-entries">{t.entries.map(entry=><div className="recent-entry" key={entry.id}><b>{typeof entry.value==="string"?entry.value:JSON.stringify(entry.value)}</b><span>{entry.note||""}</span><time>{entry.author.name} · {entry.createdAt.toLocaleDateString()}</time></div>)}</div>}</article>)}</div>:<div className="empty-state"><strong>No work trackers yet</strong><p>Create the first tracker for team projects, milestones, service indicators, risks, or any work-specific measure.</p>{canWriteWork(membership.role)&&<WorkTrackerForm organizationId={organizationId}/>}</div>}</section>
        <section id="members" className="dashboard-section"><div className="section-title"><div><p className="eyebrow">AUTHORIZATION</p><h2>Members & roles <span className="count">{organization.members.length}</span></h2></div></div><div className="members-list">{organization.members.map(member=><div className="member-line" key={member.id}><span className="avatar">{member.user.name.slice(0,1).toUpperCase()}</span><span className="member-person"><b>{member.user.name}</b><small>{member.user.email}</small></span><span className="role-pill">{member.role}</span></div>)}</div><div className="role-explainer"><b>Role scope</b><span>Owner/admin manage organization access. Members create and update work trackers. Viewers read workspace-shared trackers.</span></div></section>
        {canManageWorkspace(membership.role)&&<section className="dashboard-section"><div className="section-title"><div><p className="eyebrow">TEAM ONBOARDING</p><h2>Invite teammates</h2></div></div><div className="invite-panel"><OrganizationInviteForm organizationId={organizationId}/>{pendingInvitations.length>0&&<div className="pending-invites"><strong>Pending invitations <span className="count">{pendingInvitations.length}</span></strong>{pendingInvitations.map(invite=><div className="pending-invite" key={invite.id}><span>{invite.email}</span><span className="role-pill">{invite.role ?? "member"}</span><time>Expires {invite.expiresAt.toLocaleDateString()}</time></div>)}</div>}</div></section>}
        {canManageWorkspace(membership.role)&&<section id="sso" className="dashboard-section"><div className="section-title"><div><p className="eyebrow">IDENTITY & ACCESS</p><h2>Company single sign-on</h2></div></div><OrganizationSsoSetup organizationId={organizationId}/></section>}
        <section id="activity" className="dashboard-section"><div className="section-title"><div><p className="eyebrow">AUDIT TRAIL</p><h2>Recent work activity</h2></div></div>{events.length?<div className="activity-list">{events.map(event=><div className="activity-line" key={event.id}><span className="activity-dot"/><div><b>{event.actor.name}</b><span> {event.action.replaceAll("."," ")}</span><small>{event.resourceType} · {event.resourceId}</small></div><time>{event.createdAt.toLocaleString()}</time></div>)}</div>:<div className="empty-state compact"><p>Workspace changes will be recorded here.</p></div>}</section>
        <div className="privacy-banner warm-banner"><b>Work data stays in this organization</b><span>Each record is keyed to the organization and authorized membership. Organization APIs do not query personal or public tracker tables.</span></div>
      </section></div></main>;
}
