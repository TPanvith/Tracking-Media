import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return <main className="auth-page reset-page"><a className="brand reset-brand" href="/">tracking<span>media</span></a><ResetPasswordForm token={token ?? ""} invalid={Boolean(error)} /></main>;
}

