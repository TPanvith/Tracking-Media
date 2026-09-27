"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function slugify(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60); }

export function CreateWorkspaceButton() {
  const router=useRouter(); const [open,setOpen]=useState(false); const [name,setName]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function create(event:FormEvent){event.preventDefault();setError("");setBusy(true);try{const result=await authClient.organization.create({name:name.trim(),slug:slugify(name)});if(result.error||!result.data)throw new Error(result.error?.message||"Could not create the workspace.");router.push(`/work/${result.data.id}`);router.refresh();}catch(e){setError(e instanceof Error?e.message:"Workspace setup failed.");}finally{setBusy(false);}}
  return <><button className="button primary" onClick={()=>setOpen(true)}>＋ New organization workspace</button>{open&&<div className="dialog-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="workspace-title"><button className="dialog-x" onClick={()=>setOpen(false)} aria-label="Close">×</button><p className="eyebrow">SEPARATE TEAM SPACE</p><h2 id="workspace-title">Create an organization</h2><p className="muted">Your account becomes the owner. Team data will live in this organization workspace.</p><form className="form-stack" onSubmit={create}><label>Team or organization name<input value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100} /></label>{error&&<p className="form-message" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="button quiet" onClick={()=>setOpen(false)}>Cancel</button><button className="button primary" disabled={busy}>{busy?"Creating…":"Create workspace"}</button></div></form></section></div>}</>;
}
