type SendEmailInput = { to: string; subject: string; html: string; text: string };

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const hasPlaceholder = /replace_with|your-verified-domain/i.test(`${apiKey ?? ""} ${from ?? ""}`);
  if (!apiKey || !from || hasPlaceholder) {
    if (process.env.NODE_ENV === "development") {
      console.info(`[Tracking Media local email preview]\\nTo: ${input.to}\\nSubject: ${input.subject}\\n${input.text}`);
      return;
    }
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM before sending invitations or verification links.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject: input.subject, html: input.html, text: input.text }),
  });
  if (!response.ok) throw new Error("The email provider could not deliver this message. Check the sender domain and provider credentials.");
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}
