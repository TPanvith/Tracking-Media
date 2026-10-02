import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/components/sign-in-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; mode?: string }> }) {
  const { returnTo, mode } = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });
  const safeReturnTo = returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  if (session) redirect(safeReturnTo);
  return <SignInForm returnTo={safeReturnTo} initialMode={mode === "forgot" ? "forgot" : "signin"} />;
}

