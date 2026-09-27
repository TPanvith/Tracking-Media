import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { sso } from "@better-auth/sso";
import { prisma } from "@/lib/prisma";
import { escapeHtml, sendEmail } from "@/lib/email";

const appUrl = process.env.BETTER_AUTH_URL;
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!appUrl || !authSecret) throw new Error("BETTER_AUTH_URL and BETTER_AUTH_SECRET must be configured.");

export const auth = betterAuth({
  appName: "Tracking Media",
  baseURL: appUrl,
  secret: authSecret,
  trustedOrigins: async (request) => {
    const appOrigin = process.env.NEXT_PUBLIC_APP_URL ?? appUrl;
    const identityProviderOrigins = (process.env.SSO_TRUSTED_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
    return request?.url.endsWith("/sso/register")
      ? [appOrigin, ...identityProviderOrigins]
      : [appOrigin];
  },
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, requireEmailVerification: true },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      const link = escapeHtml(url);
      await sendEmail({
        to: user.email,
        subject: "Verify your Tracking Media email",
        text: `Verify your email address: ${url}`,
        html: `<p>Verify your Tracking Media email address to finish setting up your account.</p><p><a href="${link}">Verify email</a></p>`,
      });
    },
  },
  plugins: [
    organization({
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const origin = process.env.NEXT_PUBLIC_APP_URL ?? appUrl;
        const invitationUrl = new URL(`/accept-invitation?id=${encodeURIComponent(data.id)}`, origin).toString();
        const organizationName = escapeHtml(data.organization.name);
        const inviterName = escapeHtml(data.inviter.user.name);
        const link = escapeHtml(invitationUrl);
        await sendEmail({
          to: data.email,
          subject: `Join ${data.organization.name} on Tracking Media`,
          text: `${data.inviter.user.name} invited you to join ${data.organization.name} on Tracking Media. Accept the invitation: ${invitationUrl}`,
          html: `<p>${inviterName} invited you to join <strong>${organizationName}</strong> on Tracking Media.</p><p><a href="${link}">Review invitation</a></p><p>This invitation expires according to your organization's invitation policy.</p>`,
        });
      },
    }),
    sso({
      organizationProvisioning: { disabled: false, defaultRole: "member" },
      domainVerification: { enabled: true },
    }),
  ],
});
